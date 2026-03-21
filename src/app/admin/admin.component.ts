import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamAdminComponent } from '../team-admin/team-admin.component';
import { GameState, Team } from '../models';
import { EventBusService } from '../services/event-bus.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TeamAdminComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  initialScore = 501;
  leftTeam: Team = this.createEmptyTeam('Green Team');
  rightTeam: Team = this.createEmptyTeam('Blue Team');

  constructor(private eventBus: EventBusService) {}

  private createEmptyTeam(teamName: string): Team {
    return {
      teamName: teamName,
      points: 0,
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
    console.log('updating scoreboard');

    const gameState: GameState = {
      initialScore: this.initialScore,
      leftTeam: this.leftTeam,
      rightTeam: this.rightTeam
    };

    console.log('updating scoreboard', gameState)

    localStorage.setItem('scoreboard', JSON.stringify(gameState));

    this.eventBus.emitScoreUpdated();
  }
}