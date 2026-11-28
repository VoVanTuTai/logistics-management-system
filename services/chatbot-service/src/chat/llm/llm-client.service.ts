import { Injectable, Logger } from '@nestjs/common';
import { ChatHistoryMessage, LlmToolDefinition } from '../chat.types';
import { SessionStoreHealth } from '../session/chat-session.store';

export interface MultiTurnLlmOptions {
  temperature?: number;
  maxTokens?: number;
  tools?: LlmToolDefinition[];
  toolChoice?: 'auto' | 'required' | { type: 'function'; function: { name: string } };
  jsonMode?: boolean;
}

export interface ToolCallDecision {
  toolName: string;
  args: Record<string, any>;
  modelUsed: string;
  provider: 'groq' | 'openai' | 'gemini';
}

export interface AgentStatusEntry {
  role: string;
  provider: string;
  model: string;
  status: string;
  latencyMs: number;
}

/**
 * Unified Multi-Provider LLM Client (Gemini Supervisor, Groq Qwen Knowledge, Groq GPT-OSS Operation, OpenAI fallback).
 * Ensures multi-turn conversation history is injected into EVERY provider call so the model never suffers amnesia.
 */
@Injectable()
export class LlmClientService {
  private readonly logger = new Logger(LlmClientService.name);

  readonly geminiApiKey: string;
  readonly geminiModel: string;

  readonly groqApiKey: string;
  readonly groqKnowledgeModel: string;
  readonly groqOperationModel: string;

  readonly nvidiaApiKey: string;
  readonly nvidiaValidationModel: string;
  readonly validationProvider: string;
  readonly validationModel: string;
  readonly openrouterApiKey: string;

  readonly openaiApiKey: string;
  readonly openaiModel: string;
  readonly openaiTemperature: number;

  constructor() {
    this.geminiApiKey = (process.env.GEMINI_API_KEY || '').trim();
    this.geminiModel = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();

    this.groqApiKey = (process.env.GROQ_API_KEY || '').trim();
    this.groqKnowledgeModel = (process.env.GROQ_KNOWLEDGE_MODEL || 'qwen/qwen3-32b').trim();
    this.groqOperationModel = (process.env.GROQ_OPERATION_MODEL || 'openai/gpt-oss-120b').trim();

    this.nvidiaApiKey = (process.env.NVIDIA_API_KEY || '').trim();
    this.nvidiaValidationModel = (process.env.NVIDIA_VALIDATION_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b').trim();
    this.validationProvider = (process.env.VALIDATION_PROVIDER || 'groq').trim().toLowerCase();
    this.validationModel = (process.env.VALIDATION_MODEL || 'openai/gpt-oss-safeguard-20b').trim();
    this.openrouterApiKey = (process.env.OPENROUTER_API_KEY || '').trim();

    this.openaiApiKey = (process.env.OPENAI_API_KEY || '').trim();
    this.openaiModel = (process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim();
    this.openaiTemperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.2');
  }

  hasAnyLlmKey(): boolean {
    return Boolean(this.geminiApiKey || this.groqApiKey || this.openaiApiKey);
  }

  /**
   * Build sanitized history turns excluding consecutive duplicates and bounding token footprint.
   */
  private sanitizeHistory(history: ChatHistoryMessage[], currentUserMessage?: string, maxTurns = 12): ChatHistoryMessage[] {
    if (!Array.isArray(history) || history.length === 0) return [];
    const sliced = history
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0)
      .slice(-maxTurns);

    // Prevent duplicating the current user prompt if already pushed optimistically
    if (
      currentUserMessage &&
      sliced.length > 0 &&
      sliced[sliced.length - 1].role === 'user' &&
      sliced[sliced.length - 1].content.trim() === currentUserMessage.trim()
    ) {
      sliced.pop();
    }

    // Clip overly long assistant turns so context window stays focused
    return sliced.map((m) => ({
      role: m.role,
      content: m.content.length > 1500 ? `${m.content.slice(0, 1500)}...` : m.content,
    }));
  }

  /**
   * OpenAI-compatible Chat Completions (Groq LPU & OpenAI) WITH multi-turn history & optional Function Calling.
   */
  async callOpenAiCompatible(
    apiUrl: string,
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    history: ChatHistoryMessage[] = [],
    timeoutMs = 8000,
    options?: MultiTurnLlmOptions,
  ): Promise<string> {
    const cleanHistory = this.sanitizeHistory(history);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...cleanHistory.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userPrompt },
    ];

    const bodyPayload: Record<string, any> = {
      model,
      messages,
      temperature: options?.temperature ?? this.openaiTemperature,
      max_tokens: options?.maxTokens ?? 3072,
    };

    if (options?.jsonMode) {
      bodyPayload.response_format = { type: 'json_object' };
    }

    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyPayload),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`OpenAI-Compatible [${model}] HTTP ${resp.status}: ${errText}`);
    }

    const data: any = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`OpenAI-Compatible [${model}] returned empty content.`);
    }
    return content;
  }

  /**
   * Native Google Gemini REST call WITH multi-turn contents history & systemInstruction.
   */
  async callGemini(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    history: ChatHistoryMessage[] = [],
    timeoutMs = 12000,
    options?: MultiTurnLlmOptions,
  ): Promise<string> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`;
    const cleanHistory = this.sanitizeHistory(history);

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = cleanHistory.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Gemini requires conversation contents not to start with 'model' or leave consecutive identical roles awkward;
    // ensure first message is 'user' by prepending synthetic user anchor only if needed.
    if (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }
    contents.push({ role: 'user', parts: [{ text: userPrompt }] });

    const generationConfig: Record<string, any> = {
      temperature: options?.temperature ?? this.openaiTemperature,
      maxOutputTokens: options?.maxTokens ?? 3072,
    };
    if (options?.jsonMode) {
      generationConfig.responseMimeType = 'application/json';
    }

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`Gemini [${model}] HTTP ${resp.status}: ${errText}`);
    }

    const data: any = await resp.json();
    const candidate = data?.candidates?.[0];
    const finishReason = candidate?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      this.logger.warn(`Gemini [${model}] finished with non-STOP reason: ${finishReason}`);
    }
    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error(`Gemini [${model}] returned empty candidates.`);
    }
    return text;
  }

  /**
   * Native Function Calling / Tool Routing via Groq LPU / OpenAI / Gemini functionDeclarations.
   * Gives the Intent Router genuine structured parameter extraction over full multi-turn history.
   */
  async callToolRouter(
    systemPrompt: string,
    userMessage: string,
    history: ChatHistoryMessage[],
    tools: LlmToolDefinition[],
    timeoutMs = 4500,
  ): Promise<ToolCallDecision | null> {
    const cleanHistory = this.sanitizeHistory(history, userMessage, 10);

    // 1. Try Groq Operation Model (ultra-fast LPU Function Calling) or OpenAI
    const openAiCandidates: Array<{ provider: 'groq' | 'openai'; url: string; key: string; model: string }> = [];
    if (this.groqApiKey) {
      openAiCandidates.push({
        provider: 'groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        key: this.groqApiKey,
        model: this.groqOperationModel,
      });
    }
    if (this.openaiApiKey) {
      openAiCandidates.push({
        provider: 'openai',
        url: 'https://api.openai.com/v1/chat/completions',
        key: this.openaiApiKey,
        model: this.openaiModel,
      });
    }

    for (const cand of openAiCandidates) {
      try {
        const messages = [
          { role: 'system', content: systemPrompt },
          ...cleanHistory.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage },
        ];
        const resp = await fetch(cand.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cand.key}`,
          },
          body: JSON.stringify({
            model: cand.model,
            messages,
            tools,
            tool_choice: 'required',
            parallel_tool_calls: false,
            temperature: 0.0,
            max_tokens: 350,
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (resp.ok) {
          const data: any = await resp.json();
          const tc = data?.choices?.[0]?.message?.tool_calls?.[0];
          if (tc?.function?.name) {
            const rawArgs = typeof tc.function.arguments === 'string'
              ? JSON.parse(tc.function.arguments || '{}')
              : (tc.function.arguments || {});
            return {
              toolName: tc.function.name,
              args: rawArgs,
              modelUsed: cand.model,
              provider: cand.provider,
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Tool Router [${cand.provider}:${cand.model}] failed: ${err?.message}`);
      }
    }

    // 2. Try Google Gemini Function Calling
    if (this.geminiApiKey) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;
        const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = cleanHistory.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));
        if (contents.length > 0 && contents[0].role === 'model') contents.shift();
        contents.push({ role: 'user', parts: [{ text: userMessage }] });

        const functionDeclarations = tools.map((t) => ({
          name: t.function.name,
          description: t.function.description,
          parameters: t.function.parameters,
        }));

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            tools: [{ functionDeclarations }],
            toolConfig: {
              functionCallingConfig: { mode: 'ANY' },
            },
            generationConfig: { temperature: 0.0, maxOutputTokens: 350 },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (resp.ok) {
          const data: any = await resp.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          const fcPart = parts.find((p: any) => p.functionCall?.name);
          if (fcPart?.functionCall?.name) {
            return {
              toolName: fcPart.functionCall.name,
              args: fcPart.functionCall.args || {},
              modelUsed: this.geminiModel,
              provider: 'gemini',
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Tool Router [gemini:${this.geminiModel}] failed: ${err?.message}`);
      }
    }

    return null;
  }

  /**
   * Multi-Agent Synthesis Pipeline: selects optimal agent for the intent (Operation vs Knowledge vs Supervisor)
   * and ALWAYS injects prior multi-turn conversation history and long-term episodic memory.
   */
  async synthesizeAnswer(params: {
    systemPrompt: string;
    userPrompt: string;
    rawUserQuestion: string;
    history: ChatHistoryMessage[];
    conversationSummary?: string;
    hasOperationalTools: boolean;
    hasKnowledgeRag: boolean;
  }): Promise<{ answer: string; agentModelUsed: string; llmStatusNote: string }> {
    const cleanHistory = this.sanitizeHistory(params.history, params.rawUserQuestion, 14);
    const hasHistory = cleanHistory.length > 0;

    let effectiveSystemPrompt = params.systemPrompt;
    if (params.conversationSummary && params.conversationSummary.trim().length > 0) {
      effectiveSystemPrompt =
        `=== BỘ NHỚ TIẾN TRÌNH HỘI THOẠI DÀI HẠN (LONG-TERM EPISODIC MEMORY) ===\n` +
        `${params.conversationSummary.trim()}\n` +
        `========================================================================\n\n` +
        params.systemPrompt;
    }

    if (hasHistory) {
      this.logger.log(`Injecting ${cleanHistory.length} prior history message(s) into LLM synthesis prompt.`);
    }

    if (params.hasOperationalTools && this.groqApiKey) {
      try {
        this.logger.log(`Dispatching Operation Worker: [${this.groqOperationModel}] via Groq LPU`);
        const answer = await this.callOpenAiCompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          this.groqApiKey,
          this.groqOperationModel,
          effectiveSystemPrompt,
          params.userPrompt,
          cleanHistory,
        );
        return { answer, agentModelUsed: `Groq LPU (${this.groqOperationModel})`, llmStatusNote: 'Success' };
      } catch (e: any) {
        this.logger.warn(`Operation Worker Groq error: ${e?.message}. Falling back to Supervisor Agent...`);
      }
    } else if (params.hasKnowledgeRag && this.groqApiKey) {
      try {
        this.logger.log(`Dispatching Knowledge Worker: [${this.groqKnowledgeModel}] via Groq LPU`);
        const answer = await this.callOpenAiCompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          this.groqApiKey,
          this.groqKnowledgeModel,
          effectiveSystemPrompt,
          params.userPrompt,
          cleanHistory,
        );
        return { answer, agentModelUsed: `Groq LPU (${this.groqKnowledgeModel})`, llmStatusNote: 'Success' };
      } catch (e: any) {
        this.logger.warn(`Knowledge Worker Groq error: ${e?.message}. Falling back to Supervisor Agent...`);
      }
    }

    if (this.geminiApiKey) {
      try {
        this.logger.log(`Dispatching Supervisor Agent: [${this.geminiModel}] via Google AI Studio`);
        const answer = await this.callGemini(
          this.geminiModel,
          effectiveSystemPrompt,
          params.userPrompt,
          cleanHistory,
        );
        return { answer, agentModelUsed: `Google Gemini (${this.geminiModel})`, llmStatusNote: 'Success' };
      } catch (e: any) {
        this.logger.warn(`Supervisor Gemini error: ${e?.message}. Trying fallback...`);
      }
    }

    if (this.openaiApiKey) {
      try {
        const answer = await this.callOpenAiCompatible(
          'https://api.openai.com/v1/chat/completions',
          this.openaiApiKey,
          this.openaiModel,
          effectiveSystemPrompt,
          params.userPrompt,
          cleanHistory,
        );
        return { answer, agentModelUsed: `OpenAI (${this.openaiModel})`, llmStatusNote: 'Success' };
      } catch (e: any) {
        return { answer: '', agentModelUsed: 'Offline Demo Generator', llmStatusNote: `Error: ${e?.message}` };
      }
    }

    return {
      answer: '',
      agentModelUsed: 'Offline Demo Generator',
      llmStatusNote: 'No LLM Key',
    };
  }

  /**
   * Tier 3 Recursive Conversation Summary Memory (MemGPT / Packer et al., 2023).
   * Generates or updates an ongoing cumulative summary of older conversation turns.
   */
  async generateConversationSummary(
    existingSummary: string | undefined,
    messagesToCompact: ChatHistoryMessage[],
  ): Promise<string> {
    if (!messagesToCompact || messagesToCompact.length === 0) {
      return existingSummary || '';
    }

    const conversationTranscript = messagesToCompact
      .filter((m) => m && m.content)
      .map((m) => `${m.role === 'user' ? 'Khách' : 'Bot'}: ${m.content}`)
      .join('\n');

    const prompt =
      `Nhiệm vụ: Cập nhật bản tóm tắt tích lũy ngắn gọn về tiến trình hội thoại CSKH logistics.\n` +
      (existingSummary ? `Bản tóm tắt trước đó:\n"${existingSummary}"\n\n` : '') +
      `Các lượt trao đổi mới cần nén:\n${conversationTranscript}\n\n` +
      `Yêu cầu:\n` +
      `- Tóm tắt cô đọng 2-4 câu bằng tiếng Việt.\n` +
      `- Ghi nhận chính xác: Mã đơn (nếu có), SĐT (nếu có), tuyến đường, cước phí đã báo, thỏa thuận hẹn giao/đổi địa chỉ, các câu hỏi chưa giải quyết.\n` +
      `- Không văn hoa, không chào hỏi. Chỉ xuất ra nội dung tóm tắt thuần túy.`;

    if (this.groqApiKey) {
      try {
        const res = await this.callOpenAiCompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          this.groqApiKey,
          this.groqOperationModel,
          'Bạn là công cụ tóm tắt ngữ cảnh hội thoại chuyên nghiệp.',
          prompt,
          [],
          3500,
          { temperature: 0.1, maxTokens: 250 },
        );
        if (res && res.trim().length > 10) return res.trim();
      } catch (err: any) {
        this.logger.warn(`Summary generation via Groq failed: ${err?.message}`);
      }
    }

    if (this.geminiApiKey) {
      try {
        const res = await this.callGemini(
          this.geminiModel,
          'Bạn là công cụ tóm tắt ngữ cảnh hội thoại chuyên nghiệp.',
          prompt,
          [],
          3500,
          { temperature: 0.1, maxTokens: 250 },
        );
        if (res && res.trim().length > 10) return res.trim();
      } catch (err: any) {
        this.logger.warn(`Summary generation via Gemini failed: ${err?.message}`);
      }
    }

    // High-fidelity heuristic extractive summarization fallback
    return this.heuristicSummarize(existingSummary, messagesToCompact);
  }

  private heuristicSummarize(
    existingSummary: string | undefined,
    messages: ChatHistoryMessage[],
  ): string {
    const keyFacts: string[] = [];
    if (existingSummary && existingSummary.trim()) {
      keyFacts.push(existingSummary.trim());
    }

    for (const msg of messages) {
      if (msg.role === 'user') {
        const text = msg.content;
        const codeMatch = text.match(/\b(?:NX-?\d+|333\d+|101\d+|SPX\d+)\b/i);
        if (codeMatch && !keyFacts.some((f) => f.includes(codeMatch[0]))) {
          keyFacts.push(`Mã đơn: ${codeMatch[0]}`);
        }
        const phoneMatch = text.match(/\b(?:0\d{9}|\+84\d{9})\b/);
        if (phoneMatch && !keyFacts.some((f) => f.includes(phoneMatch[0]))) {
          keyFacts.push(`SĐT: ${phoneMatch[0]}`);
        }
        if (/\b(?:hen|ngay mai|sang mai|chieu mai|doi dia chi|doi nguoi nhan)\b/i.test(text)) {
          keyFacts.push(`Yêu cầu: ${text.slice(0, 60)}`);
        }
        if (/\b(?:tinh cuoc|bao gia|gia cuoc|phi)\b/i.test(text)) {
          keyFacts.push(`Hỏi cước: ${text.slice(0, 60)}`);
        }
      }
    }

    return Array.from(new Set(keyFacts)).join('. ');
  }

  /**
   * Health Check for Heterogeneous Multi-Agent System + Session Store status.
   */
  async checkMultiAgentHealth(sessionHealth?: SessionStoreHealth) {
    const agents: AgentStatusEntry[] = [];

    if (this.geminiApiKey) {
      const start = Date.now();
      try {
        await this.callGemini(this.geminiModel, 'You are a healthcheck responder.', 'Reply OK', [], 5000);
        agents.push({ role: 'Supervisor Agent', provider: 'Google AI Studio', model: this.geminiModel, status: 'HEALTHY', latencyMs: Date.now() - start });
      } catch (e: any) {
        agents.push({ role: 'Supervisor Agent', provider: 'Google AI Studio', model: this.geminiModel, status: `ERROR: ${e.message}`, latencyMs: Date.now() - start });
      }
    } else {
      agents.push({ role: 'Supervisor Agent', provider: 'Google AI Studio', model: this.geminiModel, status: 'MISSING_API_KEY', latencyMs: 0 });
    }

    if (this.groqApiKey) {
      const startQ = Date.now();
      try {
        await this.callOpenAiCompatible('https://api.groq.com/openai/v1/chat/completions', this.groqApiKey, this.groqKnowledgeModel, 'Healthcheck', 'OK', [], 5000);
        agents.push({ role: 'Knowledge Agent (RAG)', provider: 'Groq LPU', model: this.groqKnowledgeModel, status: 'HEALTHY', latencyMs: Date.now() - startQ });
      } catch (e: any) {
        agents.push({ role: 'Knowledge Agent (RAG)', provider: 'Groq LPU', model: this.groqKnowledgeModel, status: `ERROR: ${e.message}`, latencyMs: Date.now() - startQ });
      }

      const startO = Date.now();
      try {
        await this.callOpenAiCompatible('https://api.groq.com/openai/v1/chat/completions', this.groqApiKey, this.groqOperationModel, 'Healthcheck', 'OK', [], 5000);
        agents.push({ role: 'Operation Agent (Tools)', provider: 'Groq LPU', model: this.groqOperationModel, status: 'HEALTHY', latencyMs: Date.now() - startO });
      } catch (e: any) {
        agents.push({ role: 'Operation Agent (Tools)', provider: 'Groq LPU', model: this.groqOperationModel, status: `ERROR: ${e.message}`, latencyMs: Date.now() - startO });
      }
    } else {
      agents.push({ role: 'Knowledge Agent (RAG)', provider: 'Groq LPU', model: this.groqKnowledgeModel, status: 'MISSING_API_KEY', latencyMs: 0 });
      agents.push({ role: 'Operation Agent (Tools)', provider: 'Groq LPU', model: this.groqOperationModel, status: 'MISSING_API_KEY', latencyMs: 0 });
    }

    if (this.validationProvider === 'groq' && this.groqApiKey) {
      const startV = Date.now();
      try {
        await this.callOpenAiCompatible('https://api.groq.com/openai/v1/chat/completions', this.groqApiKey, this.validationModel || 'openai/gpt-oss-safeguard-20b', 'Safety', 'OK', [], 5000);
        agents.push({ role: 'Validation Gatekeeper', provider: 'Groq Safeguard', model: this.validationModel || 'openai/gpt-oss-safeguard-20b', status: 'HEALTHY', latencyMs: Date.now() - startV });
      } catch (e: any) {
        agents.push({ role: 'Validation Gatekeeper', provider: 'Groq Safeguard', model: this.validationModel || 'openai/gpt-oss-safeguard-20b', status: `ERROR: ${e.message}`, latencyMs: Date.now() - startV });
      }
    } else if (this.openrouterApiKey) {
      const startV = Date.now();
      const modelV = this.validationModel || 'meta-llama/llama-3.3-70b-instruct:free';
      try {
        await this.callOpenAiCompatible('https://openrouter.ai/api/v1/chat/completions', this.openrouterApiKey, modelV, 'Safety', 'OK', [], 5000);
        agents.push({ role: 'Validation Gatekeeper', provider: 'OpenRouter Free', model: modelV, status: 'HEALTHY', latencyMs: Date.now() - startV });
      } catch (e: any) {
        agents.push({ role: 'Validation Gatekeeper', provider: 'OpenRouter Free', model: modelV, status: `ERROR: ${e.message}`, latencyMs: Date.now() - startV });
      }
    } else if (this.nvidiaApiKey) {
      const startV = Date.now();
      try {
        await this.callOpenAiCompatible('https://integrate.api.nvidia.com/v1/chat/completions', this.nvidiaApiKey, this.nvidiaValidationModel, 'Safety', 'OK', [], 5000);
        agents.push({ role: 'Validation Gatekeeper', provider: 'NVIDIA NIM', model: this.nvidiaValidationModel, status: 'HEALTHY', latencyMs: Date.now() - startV });
      } catch (e: any) {
        agents.push({ role: 'Validation Gatekeeper', provider: 'NVIDIA NIM', model: this.nvidiaValidationModel, status: `ERROR: ${e.message}`, latencyMs: Date.now() - startV });
      }
    } else {
      agents.push({ role: 'Validation Gatekeeper', provider: 'Rule-Based HITL', model: 'Built-in Heuristic', status: 'ACTIVE_FALLBACK', latencyMs: 0 });
    }

    return {
      architecture: 'Heterogeneous Multi-Agent System (Level 2 Function-Calling + Multi-Turn Memory)',
      sessionStore: sessionHealth,
      timestamp: new Date().toISOString(),
      agents,
    };
  }
}
