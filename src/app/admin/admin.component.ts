import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamAdminComponent } from '../team-admin/team-admin.component';
import { GameState, Team } from '../models';
import { ScoreboardService } from '../services/scoreboard.service';
import { AnswerFileService, AnswerEntry } from '../services/answer-file.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TeamAdminComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  initialScore: number;
  leftTeam: Team;
  rightTeam: Team;
  reverse: boolean = false;

  // Answer file management
  answerFiles: { name: string; answers: AnswerEntry[] }[] = [];
  selectedFileName: string = '';
  newFileName: string = '';
  uploadError: string = '';
  selectedAnswers: AnswerEntry[] = [];

  constructor(
    private scoreboardService: ScoreboardService,
    private answerFileService: AnswerFileService
  ) {
    const saved = this.scoreboardService.getGameState();

    if (saved) {
      const gameState: GameState = JSON.parse(saved);
      this.initialScore = gameState.initialScore;
      this.leftTeam = gameState.leftTeam;
      this.rightTeam = gameState.rightTeam;
    } else {
      this.initialScore = 501;
      this.leftTeam = this.createEmptyTeam('Green Team');
      this.rightTeam = this.createEmptyTeam('Blue Team');
    }

    this.loadAnswerFiles();
  }

  private loadAnswerFiles(): void {
    this.answerFiles = this.answerFileService.getFiles();
  }

  private createEmptyTeam(teamName: string, points: number = 0): Team {
    return {
      teamName: teamName,
      points: points,
      scores: Array.from({ length: 5 }, (_, i) => ({
        pass: false,
        answerText: '',
        score: null
      }))
    };
  }

  updateLeftTeam(team: Team) {
    this.leftTeam = team;
  }

  updateRightTeam(team: Team) {
    this.rightTeam = team;
  }

  updateScoreboard() {
    const gameState: GameState = {
      initialScore: this.initialScore,
      leftTeam: this.leftTeam,
      rightTeam: this.rightTeam
    };

    localStorage.setItem('scoreboard', JSON.stringify(gameState));
  }

  resetAnswers() {
    this.leftTeam = this.createEmptyTeam(this.leftTeam.teamName, this.leftTeam.points);
    this.rightTeam = this.createEmptyTeam(this.rightTeam.teamName, this.rightTeam.points);
    this.selectedFileName = '';
    this.selectedAnswers = [];
  }

  hurryUp() {
    localStorage.setItem('hurryUp', new Date().toISOString());
  }

  switch() {
    this.reverse = !this.reverse;
  }

  private selectedFile: File | null = null;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      if (!this.newFileName) {
        this.newFileName = this.selectedFile.name.replace('.csv', '');
      }
    }
  }

  uploadFile() {
    this.uploadError = '';

    if (!this.selectedFile) {
      this.uploadError = 'Please select a file first';
      return;
    }

    if (!this.newFileName.trim()) {
      this.uploadError = 'Please enter a name for the file';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = this.answerFileService.parseCsv(content);

      if (result.error) {
        this.uploadError = result.error;
        return;
      }

      this.answerFileService.saveFile({
        name: this.newFileName.trim(),
        answers: result.answers!
      });

      this.loadAnswerFiles();
      this.newFileName = '';
      this.selectedFile = null;

      // Reset file input
      const fileInput = document.querySelector('.file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    };

    reader.readAsText(this.selectedFile);
  }

  onFileSelectionChange() {
    this.selectedFileName = this.selectedFileName || '';

    if (this.selectedFileName) {
      const file = this.answerFileService.getFile(this.selectedFileName);
      this.selectedAnswers = file?.answers || [];
    } else {
      this.selectedAnswers = [];
    }

    // Wipe all current scores when file selection changes
    this.clearAllScores();
  }

  private clearAllScores() {
    this.leftTeam = this.createEmptyTeam(this.leftTeam.teamName, this.leftTeam.points);
    this.rightTeam = this.createEmptyTeam(this.rightTeam.teamName, this.rightTeam.points);
  }

  downloadExample() {
    const csvContent = 'Answer,Score\n\'Answer 1\',23\n\'Answer 2\',5\n\'Answer 3\',10';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'example_answers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}