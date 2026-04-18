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

      const { values, error: parseError } = this.parseCsvLine(line);
      if (parseError) {
        return { answers: [], error: `Invalid CSV format on line ${i + 1}: ${parseError}` };
      }

      if (values.length < 2) {
        return { answers: [], error: `Invalid CSV format on line ${i + 1}. Expected format: 'Answer', Score` };
      }

      const answer = values[0].trim();
      const scoreStr = values[1].trim();

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

  private parseCsvLine(line: string): { values: string[]; error?: string } {
    const values: string[] = [];
    let current = '';
    let i = 0;
    let quoteChar: string | null = null;

    while (i < line.length) {
      const char = line[i];

      if (quoteChar) {
        // Inside a quoted string
        if (char === quoteChar) {
          // Check for escaped quote (doubled quote)
          if (i + 1 < line.length && line[i + 1] === quoteChar) {
            current += quoteChar;
            i += 2;
          } else {
            // End of quoted string
            quoteChar = null;
            i++;
          }
        } else {
          current += char;
          i++;
        }
      } else {
        // Outside quoted string
        if (char === '"' || char === "'") {
          quoteChar = char;
          i++;
        } else if (char === ',') {
          values.push(current);
          current = '';
          i++;
        } else {
          current += char;
          i++;
        }
      }
    }

    // Push the last value
    if (quoteChar) {
      return { values: [], error: `Unclosed quote in: "${line}"` };
    }
    values.push(current);

    return { values };
  }
}