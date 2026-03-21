import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Team, AnswerScore } from '../models';

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

  @Output() teamChange = new EventEmitter<Team>();

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
    } else if (field === 'score') {
      this.scores[index].score = value === '' ? null : parseInt(value);
    }
    this.updateTeam();
  }
}