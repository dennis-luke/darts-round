import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Team, AnswerScore } from '../models';
import { AnswerEntry } from '../services/answer-file.service';

@Component({
  selector: 'app-team-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-admin.component.html',
  styleUrl: './team-admin.component.scss'
})
export class TeamAdminComponent {
  @Input() teamName = '';
  @Input() points = 0;
  @Input() scores: AnswerScore[] = [];
  @Input() team = '';
  @Input() availableAnswers: AnswerEntry[] = [];

  @Output() teamChange = new EventEmitter<Team>();

  get isAnswerFileMode(): boolean {
    return this.availableAnswers.length > 0;
  }

  updateTeam() {
    this.teamChange.emit({
      teamName: this.teamName,
      points: this.points,
      scores: this.scores
    });
  }

  updateScore(index: number, field: 'pass' | 'answerText' | 'score', value: any) {
    if (field === 'pass') {
      this.scores[index].pass = value;
    } else if (field === 'answerText') {
      this.scores[index].answerText = value;
      // If in answer file mode, automatically set the score
      if (this.isAnswerFileMode && value) {
        const selectedAnswer = this.availableAnswers.find(a => a.answer === value);
        if (selectedAnswer) {
          this.scores[index].score = selectedAnswer.score;
        }
      }
    } else if (field === 'score') {
      this.scores[index].score = value === '' ? null : parseInt(value);
    }
    this.updateTeam();
  }

  onAnswerSelect(index: number, answer: string) {
    if (!answer) {
      this.scores[index].answerText = '';
      this.scores[index].score = null;
    } else {
      this.scores[index].answerText = answer;
      const selectedAnswer = this.availableAnswers.find(a => a.answer === answer);
      if (selectedAnswer) {
        this.scores[index].score = selectedAnswer.score;
      }
    }
    this.updateTeam();
  }
}