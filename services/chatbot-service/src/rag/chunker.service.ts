import { Injectable } from '@nestjs/common';
import type { KnowledgeChunk } from './rag.types';

@Injectable()
export class ChunkerService {
  /**
   * Phân đoạn Markdown theo cấu trúc Heading kết hợp Sliding Window Overlap
   */
  public chunkMarkdown(
    fileName: string,
    content: string,
    maxWordsPerChunk = 250,
    overlapWords = 40
  ): KnowledgeChunk[] {
    const lines = content.split('\n');
    const sections: { title: string; level: number; text: string }[] = [];

    let currentTitle = fileName.replace(/\.md$/i, '');
    let currentLevel = 1;
    let currentBuffer: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        if (currentBuffer.length > 0) {
          const text = currentBuffer.join('\n').trim();
          if (text.length > 0) {
            sections.push({ title: currentTitle, level: currentLevel, text });
          }
          currentBuffer = [];
        }
        currentLevel = headingMatch[1].length;
        currentTitle = headingMatch[2].trim();
      } else {
        currentBuffer.push(line);
      }
    }

    if (currentBuffer.length > 0) {
      const text = currentBuffer.join('\n').trim();
      if (text.length > 0) {
        sections.push({ title: currentTitle, level: currentLevel, text });
      }
    }

    const chunks: KnowledgeChunk[] = [];
    let chunkSeq = 1;

    for (const sec of sections) {
      const words = sec.text.split(/\s+/).filter(Boolean);

      if (words.length <= maxWordsPerChunk) {
        chunks.push({
          id: `${fileName}#chunk-${chunkSeq++}`,
          sourceFile: fileName,
          sectionTitle: sec.title,
          level: sec.level,
          content: sec.text,
          charCount: sec.text.length,
          tokenEstimate: Math.round(words.length * 1.3),
        });
      } else {
        let start = 0;
        while (start < words.length) {
          const end = Math.min(start + maxWordsPerChunk, words.length);
          const chunkWords = words.slice(start, end);
          const chunkText = chunkWords.join(' ');

          chunks.push({
            id: `${fileName}#chunk-${chunkSeq++}`,
            sourceFile: fileName,
            sectionTitle: `${sec.title} (phần ${Math.floor(start / (maxWordsPerChunk - overlapWords)) + 1})`,
            level: sec.level,
            content: chunkText,
            charCount: chunkText.length,
            tokenEstimate: Math.round(chunkWords.length * 1.3),
          });

          if (end >= words.length) break;
          start += maxWordsPerChunk - overlapWords;
        }
      }
    }

    return chunks;
  }
}
