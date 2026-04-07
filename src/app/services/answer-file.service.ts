import { Injectable } from '@angular/core';

export interface AnswerEntry {
  answer: string;
  score: number;
}

export interface AnswerFile {
  name: string;
  answers: AnswerEntry[];
}

@Injectable({
  providedIn: 'root'
})
export class AnswerFileService {
  private readonly STORAGE_KEY = 'answerFiles';

  getFiles(): AnswerFile[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getFile(name: string): AnswerFile | undefined {
    const files = this.getFiles();
    return files.find(f => f.name === name);
  }

  saveFile(file: AnswerFile): void {
    const files = this.getFiles();
    const existingIndex = files.findIndex(f => f.name === file.name);
    if (existingIndex >= 0) {
      files[existingIndex] = file;
    } else {
      files.push(file);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
  }

  deleteFile(name: string): void {
    const files = this.getFiles().filter(f => f.name !== name);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
  }

  parseCsv(content: string): { answers: AnswerEntry[]; error?: string } {
    const lines = content.trim().split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length < 2) {
      return { answers: [], error: 'File must contain at least a header row and one data row' };
    }

    // Parse header
    const headerLine = lines[0].toLowerCase();
    const hasAnswerHeader = headerLine.includes('answer');
    const hasScoreHeader = headerLine.includes('score');

    if (!hasAnswerHeader || !hasScoreHeader) {
      return { answers: [], error: 'File must have "Answer" and "Score" headers' };
    }

    const answers: AnswerEntry[] = [];
    const seenAnswers = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Handle CSV with or without quotes
      const match = line.match(/^['"]?([^,'"]+)['"]?\s*,\s*['"]?([^,'"]+)['"]?$/);
      if (!match) {
        return { answers: [], error: `Invalid CSV format on line ${i + 1}. Expected format: 'Answer', Score` };
      }

      const answer = match[1].trim();
      const scoreStr = match[2].trim();

      if (!answer) {
        return { answers: [], error: `Empty answer on line ${i + 1}` };
      }

      if (seenAnswers.has(answer)) {
        return { answers: [], error: `Duplicate answer "${answer}" on line ${i + 1}` };
      }
      seenAnswers.add(answer);

      const score = parseInt(scoreStr, 10);
      if (isNaN(score) || score < 0) {
        return { answers: [], error: `Invalid score "${scoreStr}" on line ${i + 1}. Score must be a non-negative integer` };
      }

      answers.push({ answer, score });
    }

    if (answers.length === 0) {
      return { answers: [], error: 'No valid answer rows found in file' };
    }

    return { answers };
  }
}