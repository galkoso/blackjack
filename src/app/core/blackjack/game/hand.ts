import { Card, Hand } from '../models';
export function cardValue(card: Card): number { return card.rank === 'A' ? 11 : ['J', 'Q', 'K'].includes(card.rank) ? 10 : Number(card.rank); }
export function calculateHand(cards: readonly Card[]): { value: number; soft: boolean } {
  let value = cards.reduce((sum, card) => sum + cardValue(card), 0);
  let aces = cards.filter(card => card.rank === 'A').length;
  while (value > 21 && aces > 0) { value -= 10; aces--; }
  return { value, soft: aces > 0 };
}
export function isPair(cards: readonly Card[]): boolean { return cards.length === 2 && cardValue(cards[0]) === cardValue(cards[1]); }
export function isBlackjack(hand: Hand): boolean { return !hand.fromSplit && hand.cards.length === 2 && calculateHand(hand.cards).value === 21; }
export function isBust(cards: readonly Card[]): boolean { return calculateHand(cards).value > 21; }
