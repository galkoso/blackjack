import { computed, inject, Injectable, signal } from '@angular/core';
import { Action, DeckCount } from '../core/blackjack/models';
import { PERSISTENCE } from './storage';
export interface Decision { readonly id: number; readonly player: string; readonly dealer: string; readonly action: Action; readonly recommended: Action; readonly correct: boolean; readonly decks: DeckCount }
export interface Statistics { readonly total: number; readonly correct: number; readonly streak: number; readonly best: number; readonly recent: readonly Decision[] }
const EMPTY: Statistics = { total: 0, correct: 0, streak: 0, best: 0, recent: [] };
function valid(value: unknown): value is Statistics {
  if (!value || typeof value !== 'object') return false;
  const s = value as Statistics;
  const actions = ['Hit', 'Stand', 'Double', 'Split'];
  return [s.total, s.correct, s.streak, s.best].every(n => Number.isSafeInteger(n) && n >= 0)
    && s.correct <= s.total && s.streak <= s.best && s.best <= s.correct && Array.isArray(s.recent) && s.recent.length <= 10
    && s.recent.every(d => d && Number.isFinite(d.id) && typeof d.player === 'string' && typeof d.dealer === 'string'
      && actions.includes(d.action) && actions.includes(d.recommended) && typeof d.correct === 'boolean' && [1, 2, 4, 6, 8].includes(d.decks));
}
@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private readonly storage = inject(PERSISTENCE);
  private readonly saved = this.storage.read('blackjack.statistics.v1');
  private readonly state = signal<Statistics>(valid(this.saved) ? this.saved : EMPTY);
  readonly stats = this.state.asReadonly();
  readonly accuracy = computed(() => this.stats().total ? Math.round(this.stats().correct / this.stats().total * 100) : 0);
  record(decision: Omit<Decision, 'id'>): void {
    this.state.update(s => {
      const streak = decision.correct ? s.streak + 1 : 0;
      return { total: s.total + 1, correct: s.correct + Number(decision.correct), streak, best: Math.max(s.best, streak), recent: [{ ...decision, id: s.total + 1 }, ...s.recent].slice(0, 10) };
    });
    this.storage.write('blackjack.statistics.v1', this.stats());
  }
  clear(): void {
    this.state.set(EMPTY);
    this.storage.write('blackjack.statistics.v1', EMPTY);
  }
}
