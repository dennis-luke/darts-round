import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subject, switchMap, takeUntil, timer } from 'rxjs';

const INTERVAL = 1000;

@Component({
  selector: 'app-team-board',
  imports: [CommonModule],
  providers: [HttpClient],
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
  private previousAnswerScores: any[] = [];

  constructor(private http: HttpClient, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.closeTimer.next(null);
  }

  ngOnInit(): void {
    this.teamName = this.teamScores?.teamName;
    this.answerScores = this.teamScores ? this.teamScores.scores : [];
    this.points = this.teamScores?.points;

    // Initialize previousAnswerScores for first comparison
    this.previousAnswerScores = JSON.parse(JSON.stringify(this.answerScores));

    timer(0, INTERVAL).pipe(
      switchMap(() => this.getScoresFromFile()),
      takeUntil(this.closeTimer)
    ).subscribe({
      next: (json: any) => {
        if (!this.updating) {
          this.updateBoard(json);
        }
      }
    });
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

  private getScoresFromFile() {
    return this.http.get('assets/scores.json');
  }

  private updateBoard(json: Object) {
    this.updating = true;
    let scores: any = json;
    this.initialScore = scores.initialScore;
    this.points = this.getTeamPoints(scores);
    this.teamName = this.getTeamName(scores);
    this.changeDetectorRef.detectChanges();
    let answerScores = this.getAnswerScores(scores);

    // Check if a new pass was added
    this.checkForNewPass(answerScores);

    let newTotal = this.initialScore - this.calculateAnswersTotal(answerScores);
    let diff = this.score - newTotal;
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
        this.showChickenGiphy = true;
        this.changeDetectorRef.detectChanges();

        // Hide after 3 seconds and return to scoreboard
        setTimeout(() => {
          this.showChickenGiphy = false;
          this.changeDetectorRef.detectChanges();
        }, 3000);
        break;
      }
    }
  }

  animateScore(i: number, frames: number, diff: number, originalScore: number, newTotal: number, answerScores: any[]) {
    
    if (i < frames) {
      let x = i / frames;
      this.score = Math.round(originalScore - diff * (2 * x - x * x));
      this.changeDetectorRef.detectChanges();
      setTimeout(() => this.animateScore(i + 1, frames, diff, originalScore, newTotal, answerScores), 10);
    } else {
      this.animating = false;
      this.score = newTotal;
      this.answerScores = answerScores;
      this.updating = false;
    };
  }

  getAnswerScores(scores: any): any[] {
    if (this.side == 'left') {
      return scores.leftTeam.scores;
    } else {
      return scores.rightTeam.scores;
    }
  }

  getTeamPoints(scores: any): number {
    if (this.side == 'left') {
      return scores.leftTeam.points;
    } else {
      return scores.rightTeam.points;
    }
  }

  getTeamName(scores: any): string {
    if (this.side == 'left') {
      return scores.leftTeam.teamName;
    } else {
      return scores.rightTeam.teamName;
    }
  }

}
