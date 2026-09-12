import { computed, inject, Injectable, signal } from '@angular/core';
import { Action, GameState, StrategyResult } from '../core/blackjack/models';
import { createShoe, shuffleShoe } from '../core/blackjack/game/deck';
import { dealGame, legalActions } from '../core/blackjack/game/game-engine';
import { calculateHand } from '../core/blackjack/game/hand';
import { getOptimalAction } from '../core/blackjack/strategy/strategy-engine';
import { SettingsService } from './settings.service';
import { StatisticsService } from './statistics.service';
export interface Feedback { readonly correct: boolean; readonly chosen: Action; readonly strategy: StrategyResult }
@Injectable({ providedIn: 'root' })
export class BlackjackGameService {
  private readonly settings = inject(SettingsService);
  private readonly statistics = inject(StatisticsService);
  private readonly gameState = signal<GameState>(this.generate());
  private readonly feedbackState = signal<Feedback | null>(null);
  readonly game = this.gameState.asReadonly();
  readonly feedback = this.feedbackState.asReadonly();
  readonly hand = computed(() => this.game().hands[0]);
  readonly value = computed(() => calculateHand(this.hand().cards));
  readonly actions = computed(() => this.feedback() ? [] : legalActions(this.hand(), this.settings.rules()));
  choose(action: Action): void {
    if (!this.actions().includes(action)) return;
    const strategy = getOptimalAction(this.hand(), this.game().dealer[0], this.settings.rules());
    const correct = strategy.recommendedAction === action;
    this.feedbackState.set({ correct, chosen: action, strategy });
    this.statistics.record({ player: this.hand().cards.map(c => c.rank).join(', '), dealer: this.game().dealer[0].rank, action, recommended: strategy.recommendedAction, correct, decks: this.settings.decks() });
  }
  nextHand(): void { this.gameState.set(this.generate()); this.feedbackState.set(null); }
  private generate(): GameState {
    // Independent fresh-shoe exercises. Skip naturals (including dealer peek) because no decision exists.
    for (let attempt = 0; attempt < 100; attempt++) {
      const game = dealGame(shuffleShoe(createShoe(this.settings.rules().decks), Math.random));
      if (!game.finished) return game;
    }
    throw new Error('Unable to deal a training hand');
  }
}
