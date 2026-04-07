import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TeamBoardComponent } from '../team-board/team-board.component';
import { GameState, Team } from '../models';

@Component({
  selector: 'app-scoreboard',
  imports: [CommonModule, TeamBoardComponent],
  providers: [HttpClient],
  templateUrl: './scoreboard.component.html',
  styleUrl: './scoreboard.component.scss'
})
export class ScoreboardComponent implements OnInit {
  gameState: GameState = this.initGamesState();
  isFullscreen = false;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.gameState = this.initGamesState();
  }

  toggleFullscreen(): void {
    if (this.isFullscreen) {
      document.exitFullscreen?.() || (document as any).webkitExitFullscreen?.();
    } else {
      const el = this.elementRef.nativeElement;
      el.requestFullscreen?.() || (el as any).webkitRequestFullscreen?.();
    }
  }

  @HostListener('document:fullscreenchange')
  @HostListener('document:webkitfullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
  }

  initGamesState(): GameState {
    return {
      initialScore: 501,
      leftTeam: this.createEmptyTeam('Green Team'),
      rightTeam: this.createEmptyTeam('Blue Team')
    };
  }

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
}