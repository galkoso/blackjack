import { describe, expect, it } from 'vitest';
import { Card, DEFAULT_RULES, DECK_COUNTS, Hand, Rank } from './models';
import { createShoe, drawCard, seededRandom, shuffleShoe } from './game/deck';
import { calculateHand, isBlackjack, isBust, isPair } from './game/hand';
import { applyAction, dealGame, legalActions, playDealer, settleHand } from './game/game-engine';
import { getOptimalAction } from './strategy/strategy-engine';
import { DOUBLE_DECK, MULTI_DECK, SINGLE_DECK } from './strategy/strategy-tables';
const cards = (...ranks: Rank[]): Card[] => ranks.map(rank => ({ rank, suit: '♠' }));
const hand = (...ranks: Rank[]): Hand => ({ cards: cards(...ranks) });
describe('hand evaluation', () => {
  it.each([
    [['A', 'A', '9'], 21, true], [['A', 'A', '9', 'K'], 21, false], [['A', '6'], 17, true],
    [['A', '6', 'K'], 17, false], [['A', 'A', 'A'], 13, true], [['10', '6'], 16, false],
  ] as [Rank[], number, boolean][])('%j = %i, soft %s', (ranks, value, soft) => expect(calculateHand(cards(...ranks))).toEqual({ value, soft }));
  it('recognizes naturals, split 21, bust and value pairs', () => {
    expect(isBlackjack(hand('A', 'K'))).toBe(true);
    expect(isBlackjack({ ...hand('A', 'K'), fromSplit: true })).toBe(false);
    expect(isBlackjack(hand('7', '7', '7'))).toBe(false);
    expect(isBust(cards('K', 'Q', '2'))).toBe(true);
    expect(isPair(cards('K', 'Q'))).toBe(true);
    expect(isPair(cards('8', '8', '2'))).toBe(false);
  });
});
describe('shoes and game transitions', () => {
  it.each(DECK_COUNTS)('%i decks have exact multiplicities and reproducible shuffles', decks => {
    const shoe = createShoe(decks);
    expect(shoe).toHaveLength(decks * 52);
    expect(shoe.filter(c => c.rank === 'A' && c.suit === '♠')).toHaveLength(decks);
    const shuffled = shuffleShoe(shoe, seededRandom(42));
    expect(shuffled).toEqual(shuffleShoe(shoe, seededRandom(42)));
    expect(shuffled).not.toEqual(shoe);
    expect(shuffled.map(c => c.rank + c.suit).sort()).toEqual(shoe.map(c => c.rank + c.suit).sort());
    expect(drawCard(shoe).shoe).toHaveLength(shoe.length - 1);
  });
  it('rejects empty shoes and invalid random values', () => {
    expect(() => drawCard([])).toThrow();
    expect(() => shuffleShoe(createShoe(1), () => 1)).toThrow();
  });
  it('enforces split, double and terminal legality', () => {
    expect(legalActions(hand('8', '8'), DEFAULT_RULES)).toContain('Split');
    expect(legalActions(hand('8', '7'), DEFAULT_RULES)).not.toContain('Split');
    expect(legalActions(hand('8', '8'), DEFAULT_RULES, 4)).not.toContain('Split');
    expect(legalActions(hand('2', '3', '4'), DEFAULT_RULES)).not.toContain('Double');
    expect(legalActions({ ...hand('5', '6'), fromSplit: true }, DEFAULT_RULES)).toContain('Double');
    expect(legalActions({ ...hand('5', '6'), fromSplit: true }, { ...DEFAULT_RULES, doubleAfterSplit: false })).not.toContain('Double');
    expect(legalActions(hand('A', 'K'), DEFAULT_RULES)).toEqual([]);
    expect(legalActions(hand('K', 'Q', '3'), DEFAULT_RULES)).toEqual([]);
  });
  it('splits without mutation and doubles with exactly one card', () => {
    const original = dealGame(cards('8', '6', '8', '10', '3', '2', 'K'));
    const split = applyAction(original, 'Split', DEFAULT_RULES);
    expect(original.hands).toHaveLength(1);
    expect(split.hands.map(h => h.cards.map(c => c.rank))).toEqual([['8', '3'], ['8', '2']]);
    const doubled = applyAction(split, 'Double', DEFAULT_RULES);
    expect(doubled.hands[0].cards).toHaveLength(3);
    expect(doubled.hands[0].doubled).toBe(true);
    expect(doubled.activeHand).toBe(1);
  });
  it('split aces receive one card only; no resplitting aces', () => {
    const state = applyAction(dealGame(cards('A', '6', 'A', '10', 'A', 'K')), 'Split', DEFAULT_RULES);
    expect(state.finished).toBe(true);
    expect(legalActions(state.hands[0], DEFAULT_RULES, 2)).toEqual([]);
    expect(isBlackjack(state.hands[1])).toBe(false);
  });
  it('hits, stands, rejects illegal actions and respects S17', () => {
    const state = dealGame(cards('10', 'A', '6', '6', '2'));
    expect(() => applyAction(state, 'Split', DEFAULT_RULES)).toThrow();
    expect(applyAction(state, 'Hit', DEFAULT_RULES).hands[0].cards).toHaveLength(3);
    const stood = applyAction(state, 'Stand', DEFAULT_RULES);
    expect(playDealer(stood).dealer).toHaveLength(2);
    expect(() => applyAction(stood, 'Hit', DEFAULT_RULES)).toThrow();
  });
  it('settles naturals at 3:2, doubles, pushes and busts', () => {
    expect(settleHand(hand('A', 'K'), cards('10', '8'), DEFAULT_RULES)).toBe(1.5);
    expect(settleHand(hand('A', 'K'), cards('A', 'Q'), DEFAULT_RULES)).toBe(0);
    expect(settleHand({ ...hand('10', 'K'), doubled: true }, cards('10', '8'), DEFAULT_RULES)).toBe(2);
    expect(settleHand(hand('K', 'Q', '5'), cards('10', 'K', '4'), DEFAULT_RULES)).toBe(-1);
  });
});
describe('verified S17 basic strategy', () => {
  it.each([
    [['10', '6'], '10', 'Hit'], [['10', '2'], '4', 'Stand'], [['5', '6'], '6', 'Double'],
    [['10', '7'], 'A', 'Stand'], [['8', '8'], '10', 'Split'], [['A', 'A'], 'A', 'Split'],
    [['10', '10'], '6', 'Stand'], [['A', '7'], '3', 'Double'], [['A', '7'], '9', 'Hit'],
  ] as [Rank[], Rank, string][])('%j vs %s → %s', (ranks, up, action) => {
    for (const decks of DECK_COUNTS) expect(getOptimalAction(hand(...ranks), cards(up)[0], { ...DEFAULT_RULES, decks }).recommendedAction).toBe(action);
  });
  it.each([
    [1, ['3', '5'], '5', 'Double'], [2, ['3', '5'], '5', 'Hit'], [1, ['A', '8'], '6', 'Double'],
    [2, ['A', '8'], '6', 'Stand'], [2, ['4', '5'], '2', 'Double'], [6, ['4', '5'], '2', 'Hit'],
    [1, ['7', '7'], '10', 'Stand'], [2, ['7', '7'], '10', 'Hit'], [1, ['A', '7'], 'A', 'Stand'],
    [2, ['A', '7'], 'A', 'Hit'], [2, ['6', '6'], '7', 'Split'], [6, ['6', '6'], '7', 'Hit'],
  ] as [typeof DECK_COUNTS[number], Rank[], Rank, string][])('%i decks: %j vs %s → %s', (decks, ranks, up, action) => {
    expect(getOptimalAction(hand(...ranks), cards(up)[0], { ...DEFAULT_RULES, decks }).recommendedAction).toBe(action);
  });
  it('uses double fallbacks and DAS-sensitive pairs', () => {
    expect(getOptimalAction(hand('A', '2', '5'), cards('3')[0], DEFAULT_RULES).recommendedAction).toBe('Stand');
    expect(getOptimalAction(hand('2', '4', '5'), cards('6')[0], DEFAULT_RULES).recommendedAction).toBe('Hit');
    expect(getOptimalAction(hand('4', '4'), cards('5')[0], { ...DEFAULT_RULES, doubleAfterSplit: false }).recommendedAction).toBe('Hit');
    expect(getOptimalAction(hand('4', '4'), cards('5')[0], { ...DEFAULT_RULES, decks: 1, doubleAfterSplit: false }).recommendedAction).toBe('Double');
    expect(getOptimalAction(hand('8', '8'), cards('10')[0], DEFAULT_RULES, 4).recommendedAction).toBe('Hit');
  });
  it('every table cell exists and every possible initial decision is legal', () => {
    for (const table of [SINGLE_DECK, DOUBLE_DECK, MULTI_DECK]) for (const section of Object.values(table))
      for (const row of Object.values(section) as string[]) expect(row).toMatch(/^[HSDdPpq]{10}$/);
    for (const decks of DECK_COUNTS) for (const first of createShoe(1).slice(0, 13)) for (const second of createShoe(1).slice(0, 13))
      for (const up of createShoe(1).slice(0, 13)) {
        const player = { cards: [first, second] };
        const rules = { ...DEFAULT_RULES, decks };
        if (legalActions(player, rules).length) expect(legalActions(player, rules)).toContain(getOptimalAction(player, up, rules).recommendedAction);
      }
  });
});
