import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { AnswerScore, GameState } from '../models';
import { ScoreboardService } from '../services/scoreboard.service';

@Component({
  selector: 'app-team-board',
  imports: [CommonModule],
  templateUrl: './team-board.component.html',
  styleUrl: './team-board.component.scss'
})
export class TeamBoardComponent implements OnInit, OnChanges, OnDestroy {

  @Input() side!: string;
  @Input() teamScores!: any;
  teamName!: string;
  @Input() initialScore!: number;
  score: number = 0;
  points!: number;
  answerScores!: any[];
  updating = false;
  animating = false;
  closeTimer = new Subject<any>();
  showChickenGiphy = false;
  chickenGiphyUrl = '';
  showCliffGiphy = false;
  cliffGiphyUrl = '';
  showCelebrationGiphy = false;
  celebrationGiphyUrl = '';
  private chickenGiphys: string[] = [];
  private cliffGiphys: string[] = [];
  private celebrationGiphys: string[] = [];
  private previousAnswerScores: any[] = [];
  private isFirstLoad = true;
  private hasCelebratedForCurrentZero = false;
  private previousScore = -1;

  constructor(private http: HttpClient, private changeDetectorRef: ChangeDetectorRef, private scoreboardService: ScoreboardService) {}

  ngOnDestroy(): void {
    this.closeTimer.next(null);
  }

  ngOnInit(): void {
    this.loadChickenGiphys();
    this.loadCliffGiphys();
    this.loadCelebrationGiphys();
    this.teamName = this.teamScores?.teamName;
    this.answerScores = this.teamScores ? this.teamScores.scores : [];
    this.points = this.teamScores?.points;

    // Initialize previousAnswerScores for first comparison
    this.previousAnswerScores = structuredClone(this.answerScores);

    window.addEventListener('storage', (event) => {
      if (event.key === 'scoreboard') {
        this.loadScoreboard();
        this.changeDetectorRef.detectChanges();
      }
    });

    this.loadScoreboard();
  }

  loadScoreboard() {
    const saved = this.scoreboardService.getGameState();

    if (saved) {
      const gameState: GameState = JSON.parse(saved);
      this.updateBoard(gameState);
    } else {
      console.warn('No scoreboard found in localStorage');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.score = this.calculateScore();
  }

  calculateScore(): number {
    return this.initialScore - this.calculateAnswersTotal(this.answerScores);
  }

  calculateAnswersTotal(answerScores: any[]): number {
    if (!answerScores) {
      return 0;
    }
    return answerScores
      .filter(answerScore => !answerScore.pass)
      .map(answerScore => answerScore.score)
      .reduce((a, b) => a + b, 0);
  }

  private loadChickenGiphys() {
    this.http.get<string[]>('assets/chicken-giphys.json').subscribe({
      next: (giphys) => {
        this.chickenGiphys = giphys;
      }
    });
  }

  private getRandomChickenGiphy(): string {
    if (this.chickenGiphys.length === 0) {
      return 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif';
    }
    return this.chickenGiphys[Math.floor(Math.random() * this.chickenGiphys.length)];
  }

  private loadCliffGiphys() {
    this.http.get<string[]>('assets/cliff-giphys.json').subscribe({
      next: (giphys) => {
        this.cliffGiphys = giphys;
      }
    });
  }

  private getRandomCliffGiphy(): string {
    if (this.cliffGiphys.length === 0) {
      return 'https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif';
    }
    return this.cliffGiphys[Math.floor(Math.random() * this.cliffGiphys.length)];
  }

  private loadCelebrationGiphys() {
    this.http.get<string[]>('assets/celebration-giphys.json').subscribe({
      next: (giphys) => {
        this.celebrationGiphys = giphys;
      }
    });
  }

  private getRandomCelebrationGiphy(): string {
    if (this.celebrationGiphys.length === 0) {
      return 'https://media.giphy.com/media/3o7TPMdB0r7YsZcvuq/giphy.gif';
    }
    return this.celebrationGiphys[Math.floor(Math.random() * this.celebrationGiphys.length)];
  }

  private showGiphy(callback: () => void): void {
    setTimeout(callback, 8000);
  }

  private updateBoard(gameState: GameState) {
    this.updating = true;
    this.initialScore = gameState.initialScore;
    this.points = this.getTeamPoints(gameState);
    this.teamName = this.getTeamName(gameState);
    this.changeDetectorRef.detectChanges();
    let answerScores = this.getAnswerScores(gameState);

    // Check if a new pass was added (skip on first load)
    if (!this.isFirstLoad) {
      this.checkForNewPass(answerScores);
    }

    let newTotal = this.initialScore - this.calculateAnswersTotal(answerScores);
    let diff = this.score - newTotal;

    // Skip animation on first load - just set the score directly
    if (this.isFirstLoad) {
      this.isFirstLoad = false;
      this.score = newTotal;
      this.previousScore = newTotal;
      this.answerScores = answerScores;
      this.updating = false;
      this.previousAnswerScores = JSON.parse(JSON.stringify(answerScores));
      return;
    }

    let animationTime = Math.min(Math.round(diff / 2), Math.round(3 + 2 * Math.random())) * 1000;
    let frames = animationTime / 10;
    let i = 0;
    const originalScore = this.score;
    this.animating = true;

    this.animateScore(i, frames, diff, originalScore, newTotal, answerScores);

    // Store current state for next comparison
    this.previousAnswerScores = JSON.parse(JSON.stringify(answerScores));
  }

  private checkForNewPass(answerScores: any[]) {
    // Skip if giphy is already showing (wait for it to finish)
    if (this.showChickenGiphy) {
      return;
    }

    // Check if any answer changed to pass
    for (let i = 0; i < answerScores.length; i++) {
      const current = answerScores[i];
      const previous = this.previousAnswerScores[i];

      // If current has pass: true and previous didn't have pass or didn't exist
      if (current && current.pass && (!previous || !previous.pass)) {
        this.chickenGiphyUrl = this.getRandomChickenGiphy();
        this.showChickenGiphy = true;
        this.changeDetectorRef.detectChanges();

        // Hide after GIF plays one complete cycle
        this.showGiphy(() => {
          this.showChickenGiphy = false;
          this.changeDetectorRef.detectChanges();
        });
        break;
      }
    }
  }

  animateScore(i: number, frames: number, diff: number, originalScore: number, newTotal: number, answerScores: any[]) {

    if (i < frames) {
      let x = i / frames;
      this.score = Math.round(originalScore - diff * (2 * x - x * x));

      // Check if score went below zero during animation (skip on first load, only if final score < 0)
      if (!this.isFirstLoad && newTotal < 0 && this.score < 0 && !this.showCliffGiphy) {
        this.cliffGiphyUrl = this.getRandomCliffGiphy();
        this.showCliffGiphy = true;
        this.showGiphy(() => {
          this.showCliffGiphy = false;
          this.changeDetectorRef.detectChanges();
        });
      }

      this.changeDetectorRef.detectChanges();
      setTimeout(() => this.animateScore(i + 1, frames, diff, originalScore, newTotal, answerScores), 10);
    } else {
      this.animating = false;
      this.score = newTotal;
      this.answerScores = answerScores;
      this.updating = false;

      // Check final score for celebration (skip on first load) - cliff is handled during animation
      // Only celebrate if score just changed TO zero, not if it was already zero
      // Check before updating previousScore
      if (!this.isFirstLoad && newTotal === 0 && this.previousScore !== 0 && !this.showCelebrationGiphy && !this.hasCelebratedForCurrentZero) {
        this.hasCelebratedForCurrentZero = true;
        this.celebrationGiphyUrl = this.getRandomCelebrationGiphy();
        this.showCelebrationGiphy = true;
        this.changeDetectorRef.detectChanges();
        this.showGiphy(() => {
          this.showCelebrationGiphy = false;
          this.changeDetectorRef.detectChanges();
        });
      }

      // Update previousScore after celebration check
      this.previousScore = newTotal;

      if (newTotal !== 0) {
        // Reset celebration flag when score moves away from zero
        this.hasCelebratedForCurrentZero = false;
      }
    };
  }

  getAnswerScores(gameState: GameState): AnswerScore[] {
    if (this.side == 'left') {
      return gameState.leftTeam.scores;
    } else {
      return gameState.rightTeam.scores;
    }
  }

  getTeamPoints(gameState: GameState): number {
    if (this.side == 'left') {
      return gameState.leftTeam.points;
    } else {
      return gameState.rightTeam.points;
    }
  }

  getTeamName(gameState: GameState): string {
    if (this.side == 'left') {
      return gameState.leftTeam.teamName;
    } else {
      return gameState.rightTeam.teamName;
    }
  }

}
