import type { KnowledgeChunk } from './types';

/**
 * Intelligent Markdown Section Chunker:
 * Tách tài liệu theo các tiêu đề H1/H2/H3 kết hợp trượt cửa sổ (Sliding window overlap)
 * để đảm bảo mỗi chunk là một đơn vị ngữ nghĩa hoàn chỉnh.
 */
export function chunkMarkdownDocument(
  sourceFile: string,
  rawMarkdown: string,
  maxWordsPerChunk = 250,
  overlapWords = 40
): KnowledgeChunk[] {
  const lines = rawMarkdown.split('\n');
  const chunks: KnowledgeChunk[] = [];

  let currentDocTitle = '';
  let currentSectionTitle = 'Tổng quan';
  let currentSectionLines: string[] = [];

  const flushSection = () => {
    const text = currentSectionLines.join('\n').trim();
    if (!text) return;

    const words = text.split(/\s+/);
    if (words.length <= maxWordsPerChunk) {
      chunks.push({
        id: `${sourceFile}#${chunks.length + 1}`,
        sourceFile,
        sectionTitle: currentDocTitle
          ? `${currentDocTitle} > ${currentSectionTitle}`
          : currentSectionTitle,
        content: text,
        wordCount: words.length,
      });
    } else {
      // Chia nhỏ đoạn dài với overlap
      let startIdx = 0;
      let partIdx = 1;
      while (startIdx < words.length) {
        const endIdx = Math.min(startIdx + maxWordsPerChunk, words.length);
        const chunkWords = words.slice(startIdx, endIdx);
        chunks.push({
          id: `${sourceFile}#${chunks.length + 1}-p${partIdx++}`,
          sourceFile,
          sectionTitle: currentDocTitle
            ? `${currentDocTitle} > ${currentSectionTitle}`
            : currentSectionTitle,
          content: chunkWords.join(' '),
          wordCount: chunkWords.length,
        });
        if (endIdx >= words.length) break;
        startIdx += maxWordsPerChunk - overlapWords;
      }
    }
    currentSectionLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      flushSection();
      currentDocTitle = trimmed.replace(/^#\s+/, '').trim();
      currentSectionTitle = currentDocTitle;
    } else if (trimmed.startsWith('## ')) {
      flushSection();
      currentSectionTitle = trimmed.replace(/^##\s+/, '').trim();
    } else if (trimmed.startsWith('### ')) {
      flushSection();
      currentSectionTitle = trimmed.replace(/^###\s+/, '').trim();
    } else {
      currentSectionLines.push(line);
    }
  }

  flushSection();
  return chunks;
}
