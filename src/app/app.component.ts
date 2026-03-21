import { Component,  OnInit  } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { TeamBoardComponent } from "./team-board/team-board.component";
import { HttpClient } from '@angular/common/http';
import { GameState, Team } from './models';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TeamBoardComponent],
  providers: [HttpClient],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  
  gameState: GameState = this.initGamesState();
  showScoreboard = true;

  constructor(private router: Router) {}

  initGamesState(): GameState {
    return {
      initialScore: 501,
      leftTeam: this.createEmptyTeam('Green Team'),
      rightTeam: this.createEmptyTeam('Blue Team')
    };

  }

  ngOnInit() {
    this.gameState = this.initGamesState();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.showScoreboard = event.url !== '/admin';
    });
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
