export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export const DECK_COUNTS = [1, 2, 4, 6, 8] as const;
export type Rank = typeof RANKS[number];
export type Suit = typeof SUITS[number];
export type DeckCount = typeof DECK_COUNTS[number];
export type Action = 'Hit' | 'Stand' | 'Double' | 'Split';
export interface Card { readonly rank: Rank; readonly suit: Suit }
export interface Rules {
  readonly decks: DeckCount;
  readonly dealerStandsSoft17: true;
  readonly doubleAfterSplit: boolean;
  readonly blackjackPayout: 1.5;
  readonly maxHands: number;
}
export const DEFAULT_RULES: Rules = { decks: 6, dealerStandsSoft17: true, doubleAfterSplit: true, blackjackPayout: 1.5, maxHands: 4 };
export interface Hand {
  readonly cards: readonly Card[];
  readonly fromSplit?: boolean;
  readonly splitAces?: boolean;
  readonly stood?: boolean;
  readonly doubled?: boolean;
}
export interface GameState {
  readonly shoe: readonly Card[];
  readonly hands: readonly Hand[];
  readonly dealer: readonly Card[];
  readonly activeHand: number;
  readonly finished: boolean;
}
export interface StrategyResult {
  readonly recommendedAction: Action;
  readonly playerValue: number;
  readonly handType: 'hard' | 'soft' | 'pair';
  readonly explanation: string;
}
