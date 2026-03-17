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

  constructor(private http: HttpClient, private changeDetectorRef: ChangeDetectorRef) {}

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

  private getGifDuration(url: string): Promise<number> {
    return new Promise<number>((resolve) => {
      // Use a longer default to ensure most GIFs complete
      const defaultDuration = 10000; // 10 seconds

      // Fetch the GIF to parse frame delays
      fetch(url)
        .then(response => response.arrayBuffer())
        .then(buffer => {
          const duration = this.parseGifDuration(buffer);
          console.log('Parsed GIF duration:', duration, 'ms');
          resolve(duration || defaultDuration);
        })
        .catch(() => {
          console.log('GIF parse failed, using default:', defaultDuration);
          resolve(defaultDuration);
        });
    });
  }

  private parseGifDuration(buffer: ArrayBuffer): number {
    const bytes = new Uint8Array(buffer);
    let totalDelay = 0;
    let frames = 0;

    if (bytes.length < 16) return 0;

    let i = 13; // Skip header (6) + LSD (10)

    while (i < bytes.length - 10) {
      // Graphic Control Extension (0x21 0xF9 0x04)
      if (bytes[i] === 0x21 && bytes[i + 1] === 0xF9 && bytes[i + 2] === 0x04) {
        const delay = bytes[i + 4] | (bytes[i + 5] << 8);
        // Delay is in centiseconds (10ms units), default to 10 if 0
        const delayMs = delay === 0 ? 10 : delay * 10;
        totalDelay += delayMs;
        frames++;
        i += 8;
      } else if (bytes[i] === 0x21 && bytes[i + 1] === 0xFF) {
        // Application Extension - skip
        const blockSize = bytes[i + 2];
        i += 3 + blockSize + 1;
      } else if (bytes[i] === 0x2C) {
        // Image Descriptor - skip
        const blockSize = bytes[i + 9];
        i += 10 + blockSize + 1;
      } else if (bytes[i] === 0x3B) {
        // GIF Trailer
        break;
      } else {
        i++;
      }
    }

    console.log('GIF frames:', frames, 'total delay:', totalDelay);
    return totalDelay;
  }

  private showGiphy(url: string, callback: () => void): void {
    this.getGifDuration(url).then((duration: number) => {
      setTimeout(callback, duration);
    });
  }

  private updateBoard(json: Object) {
    this.updating = true;
    let scores: any = json;
    this.initialScore = scores.initialScore;
    this.points = this.getTeamPoints(scores);
    this.teamName = this.getTeamName(scores);
    this.changeDetectorRef.detectChanges();
    let answerScores = this.getAnswerScores(scores);

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
        this.showGiphy(this.chickenGiphyUrl, () => {
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
        this.showGiphy(this.cliffGiphyUrl, () => {
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
        this.showGiphy(this.celebrationGiphyUrl, () => {
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
