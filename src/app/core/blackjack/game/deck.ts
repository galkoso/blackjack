import { Card, DeckCount, DECK_COUNTS, RANKS, SUITS } from '../models';
export function createShoe(decks: DeckCount): Card[] {
  if (!DECK_COUNTS.includes(decks)) throw new Error('Unsupported deck count');
  return Array.from({ length: decks }, () => SUITS.flatMap(suit => RANKS.map(rank => ({ rank, suit })))).flat();
}
/** An injected RNG makes Fisher–Yates reproducible; the input shoe is never mutated. */
export function shuffleShoe(shoe: readonly Card[], random: () => number): Card[] {
  const cards = [...shoe];
  for (let i = cards.length - 1; i > 0; i--) {
    const value = random();
    if (value < 0 || value >= 1 || !Number.isFinite(value)) throw new Error('RNG must return [0, 1)');
    const j = Math.floor(value * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
export function drawCard(shoe: readonly Card[]): { card: Card; shoe: Card[] } {
  if (!shoe.length) throw new Error('The shoe is empty');
  return { card: shoe[0], shoe: shoe.slice(1) };
}
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
}
