import { computed, inject, Injectable, signal } from '@angular/core';
import { DeckCount, DECK_COUNTS, DEFAULT_RULES } from '../core/blackjack/models';
import { PERSISTENCE } from './storage';
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly storage = inject(PERSISTENCE);
  private readonly saved = this.storage.read('blackjack.settings.v1');
  private readonly deckState = signal<DeckCount>(DECK_COUNTS.includes(this.saved as DeckCount) ? this.saved as DeckCount : 6);
  readonly decks = this.deckState.asReadonly();
  readonly rules = computed(() => ({ ...DEFAULT_RULES, decks: this.decks() }));
  save(decks: DeckCount): void {
    if (!DECK_COUNTS.includes(decks)) return;
    this.deckState.set(decks);
    this.storage.write('blackjack.settings.v1', decks);
  }
}
