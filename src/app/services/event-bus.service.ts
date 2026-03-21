import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventBusService {
  private scoreUpdatedSource = new Subject<void>();
  scoreUpdated$ = this.scoreUpdatedSource.asObservable();

  emitScoreUpdated() {
    this.scoreUpdatedSource.next();
  }
}