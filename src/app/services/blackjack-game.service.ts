import { computed, DestroyRef, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { Action, Card, HandResult, Rules, StrategyResult } from '../core/blackjack/models';
import { createShoe, shuffleShoe } from '../core/blackjack/game/deck';
import { legalActions } from '../core/blackjack/game/game-engine';
import { calculateHand, isBust } from '../core/blackjack/game/hand';
import { finishDealing, startRound, stepDealer, takeAction } from '../core/blackjack/game/round-engine';
import { getOptimalAction } from '../core/blackjack/strategy/strategy-engine';
import { SettingsService } from './settings.service';
import { StatisticsService } from './statistics.service';
export interface HandView { readonly cards: readonly Card[]; readonly value: number | null; readonly soft: boolean; readonly doubled: boolean; readonly active: boolean; readonly result: HandResult | undefined; readonly bust: boolean }
export interface Feedback { readonly correct: boolean; readonly chosen: Action; readonly strategy: StrategyResult }
export const SHOE_FACTORY = new InjectionToken<(rules: Rules) => readonly Card[]>('Shoe factory', {
  providedIn: 'root', factory: () => rules => shuffleShoe(createShoe(rules.decks), Math.random),
});
@Injectable({ providedIn: 'root' })
export class BlackjackGameService {
  private readonly settings = inject(SettingsService);
  private readonly statistics = inject(StatisticsService);
  private readonly shoeFactory = inject(SHOE_FACTORY);
  private readonly roundState = signal(this.createRound());
  private readonly feedbackState = signal<Feedback | null>(null);
  private readonly busy = signal(true);
  private readonly playerCounts = signal<readonly number[]>([0]);
  private readonly dealerCount = signal(0);
  private readonly revealed = signal(false);
  private cancelWait: (() => void) | undefined;
  private generation = 0;
  readonly round = this.roundState.asReadonly();
  readonly phase = computed(() => this.round().phase);
  readonly game = computed(() => this.round().game);
  readonly feedback = this.feedbackState.asReadonly();
  readonly dealerRevealed = this.revealed.asReadonly();
  readonly dealerCards = computed(() => this.game().dealer.slice(0, this.dealerCount()));
  readonly dealerLabel = computed(() => !this.dealerCount() ? '—' : this.revealed()
    ? String(calculateHand(this.game().dealer).value) : this.game().dealer[1]?.rank ?? '—');
  readonly hands = computed<readonly HandView[]>(() => this.game().hands.map((hand, index) => {
    const cards = hand.cards.slice(0, this.playerCounts()[index] ?? 0);
    return {
      cards, value: cards.length ? calculateHand(cards).value : null, soft: calculateHand(cards).soft,
      doubled: !!hand.doubled, bust: isBust(cards), active: this.phase() === 'player-turn' && index === this.game().activeHand,
      result: this.round().results[index]
    };
  }));
  readonly actions = computed(() => {
    const hand = this.game().hands[this.game().activeHand];
    return this.phase() === 'player-turn' && !this.busy() && hand ? legalActions(hand, this.round().rules, this.game().hands.length) : [];
  });
  readonly net = computed(() => this.round().results.reduce((sum, result) => sum + result.net, 0));
  readonly resultTitle = computed(() => {
    const results = this.round().results;
    if (!results.length) return '';
    if (results.length === 1 && results[0].outcome === 'blackjack') return 'בלאק ג׳ק!';
    if (results.every(result => result.outcome === 'bust')) return 'עברת 21';
    return this.net() > 0 ? 'ניצחת!' : this.net() < 0 ? 'הבית ניצח' : 'תיקו';
  });
  readonly status = computed(() => this.phase() === 'dealing' ? 'מחלקים קלפים…' : this.phase() === 'dealer-turn'
    ? 'תור הבית' : this.phase() === 'round-complete' ? 'הסיבוב הסתיים' : this.busy() ? 'קלף בדרך…' : 'התור שלך');

  constructor() {
    inject(DestroyRef).onDestroy(() => { this.generation++; this.cancelWait?.(); });
    void this.deal(this.generation);
  }
  private createRound() { return startRound(this.shoeFactory(this.settings.rules()), this.settings.rules()); }
  /** A new round also cancels pending animation work when settings change. */
  nextHand(): void {
    this.generation++;
    this.cancelWait?.();
    this.busy.set(true);
    this.roundState.set(this.createRound());
    this.feedbackState.set(null);
    this.playerCounts.set([0]);
    this.dealerCount.set(0);
    this.revealed.set(false);
    void this.deal(this.generation);
  }
  private wait(ms: number, generation: number): Promise<boolean> {
    return new Promise(resolve => {
      const timer = setTimeout(() => { this.cancelWait = undefined; resolve(generation === this.generation); }, ms);
      this.cancelWait = () => { clearTimeout(timer); resolve(false); };
    });
  }
  private async deal(generation: number): Promise<void> {
    for (let card = 0; card < 4; card++) {
      if (!await this.wait(card === 0 ? 100 : 260, generation)) return;
      if (card % 2 === 0) this.playerCounts.set([card === 0 ? 1 : 2]);
      else this.dealerCount.set(card === 1 ? 1 : 2);
    }
    if (!await this.wait(360, generation)) return;
    this.roundState.update(finishDealing);
    await this.resume(generation);
  }
  async choose(action: Action): Promise<void> {
    if (!this.actions().includes(action)) return;
    const generation = this.generation;
    const previous = this.round();
    const index = previous.game.activeHand;
    const hand = previous.game.hands[index];
    const strategy = getOptimalAction(hand, previous.game.dealer[0], previous.rules, previous.game.hands.length);
    const correct = strategy.recommendedAction === action;
    this.busy.set(true);
    this.feedbackState.set({ correct, chosen: action, strategy });
    this.statistics.record({
      player: hand.cards.map(c => c.rank).join(', '), dealer: previous.game.dealer[0].rank,
      action, recommended: strategy.recommendedAction, correct, decks: previous.rules.decks
    });
    this.roundState.set(takeAction(previous, action));
    if (action === 'Split') {
      const counts = [...this.playerCounts()];
      counts.splice(index, 1, 1, 1);
      this.playerCounts.set(counts);
      if (!await this.wait(220, generation)) return;
      this.showCard(index);
      if (!await this.wait(360, generation)) return;
      this.showCard(index + 1);
    } else if (action !== 'Stand') this.showCard(index);
    if (!await this.wait(action === 'Stand' ? 150 : 380, generation)) return;
    await this.resume(generation);
  }
  private showCard(index: number): void {
    this.playerCounts.update(counts => counts.map((count, i) => i === index ? count + 1 : count));
  }
  private async resume(generation: number): Promise<void> {
    if (generation !== this.generation) return;
    if (this.phase() === 'player-turn') { this.busy.set(false); return; }
    this.revealed.set(true);
    if (!await this.wait(550, generation)) return;
    while (this.phase() === 'dealer-turn') {
      this.roundState.update(stepDealer);
      this.dealerCount.set(this.game().dealer.length);
      if (this.phase() === 'dealer-turn' && !await this.wait(480, generation)) return;
    }
    this.busy.set(false);
  }
}
