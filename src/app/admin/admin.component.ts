import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamAdminComponent } from '../team-admin/team-admin.component';
import { GameState, Team } from '../models';
import { EventBusService } from '../services/event-bus.service';
import { ScoreboardService } from '../services/scoreboard.service';

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

  constructor(private eventBus: EventBusService, private scoreboardService: ScoreboardService) {
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

    this.eventBus.emitScoreUpdated();
  }

  resetAnswers() {
    this.leftTeam = this.createEmptyTeam(this.leftTeam.teamName, this.leftTeam.points);
    this.rightTeam = this.createEmptyTeam(this.rightTeam.teamName, this.rightTeam.points);
  }
}