import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScoreboardService {

  getGameState() {
    return localStorage.getItem('scoreboard');
  }
}