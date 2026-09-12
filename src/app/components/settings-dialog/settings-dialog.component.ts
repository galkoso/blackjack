import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { DeckCount, DECK_COUNTS } from '../../core/blackjack/models';
@Component({
  selector: 'app-settings-dialog', changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-dialog.component.html',
})
export class SettingsDialogComponent {
  readonly decks = input.required<DeckCount>(); readonly save = output<DeckCount>(); readonly close = output<void>();
  readonly counts = DECK_COUNTS; readonly draft = signal<DeckCount>(6); readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  constructor() { afterNextRender(() => { this.draft.set(this.decks()); this.dialog().nativeElement.showModal(); }); }
  backdrop(event: MouseEvent): void { if (event.target === this.dialog().nativeElement) this.close.emit(); }
}
