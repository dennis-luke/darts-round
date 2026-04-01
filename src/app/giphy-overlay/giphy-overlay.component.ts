import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-giphy-overlay',
  imports: [CommonModule],
  templateUrl: './giphy-overlay.component.html',
  styleUrl: './giphy-overlay.component.scss'
})
export class GiphyOverlayComponent implements OnChanges, OnDestroy {
  @Input() giphyUrl: string = '';
  @Input() visible: boolean = false;
  @Input() duration: number = 8000;
  @Input() alt: string = 'Giphy';

  @Output() hidden = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private timeoutId: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.giphyUrl) {
      this.scheduleHide();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private scheduleHide(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.hidden.emit();
    }, this.duration);
  }
}