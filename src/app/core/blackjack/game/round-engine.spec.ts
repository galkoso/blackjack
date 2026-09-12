import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, Rank, RoundState } from '../models';
import { finishDealing, startRound, stepDealer, takeAction } from './round-engine';
const round = (...ranks: Rank[]) => startRound(ranks.map(rank => ({ rank, suit: '♠' })), DEFAULT_RULES);
function finish(state: RoundState): RoundState {
  let next = state;
  while (next.phase === 'dealer-turn') next = stepDealer(next);
  return next;
}
describe('pure round state machine', () => {
  it('rejects transitions from incorrect phases', () => {
    const state = round('10', '6', '8', '10', '5');
    expect(() => takeAction(state, 'Stand')).toThrow();
    expect(() => stepDealer(state)).toThrow();
    const player = finishDealing(state);
    expect(() => finishDealing(player)).toThrow();
    expect(() => stepDealer(player)).toThrow();
    const done = finish(takeAction(player, 'Stand'));
    expect(() => takeAction(done, 'Hit')).toThrow();
    expect(() => stepDealer(done)).toThrow();
  });
  it.each([
    [['10', 'A', '8', '6'], 'win', 1, 17],
    [['10', '10', '7', '7'], 'push', 0, 17],
    [['10', '10', '7', '8'], 'loss', -1, 18],
    [['10', '6', '8', '10', '10'], 'win', 1, 26],
  ] as [Rank[], string, number, number][])('settles %j as %s', (shoe, outcome, net, dealerValue) => {
    const done = finish(takeAction(finishDealing(round(...shoe)), 'Stand'));
    expect(done.results[0]).toMatchObject({ outcome, net, dealerValue });
  });
  it.each([
    [['A', '6', 'K', '10'], 'blackjack', 1.5],
    [['10', 'A', '8', 'K'], 'loss', -1],
    [['A', 'A', 'K', 'K'], 'push', 0],
  ] as [Rank[], string, number][])('handles natural blackjack %j', (shoe, outcome, net) => {
    const done = finish(finishDealing(round(...shoe)));
    expect(done.phase).toBe('round-complete');
    expect(done.results[0]).toMatchObject({ outcome, net });
    expect(done.game.dealer).toHaveLength(2);
  });
  it('busts immediately without drawing unnecessary dealer cards', () => {
    const done = finish(takeAction(finishDealing(round('10', '2', '6', '3', 'K')), 'Hit'));
    expect(done.results[0]).toMatchObject({ outcome: 'bust', net: -1 });
    expect(done.game.dealer).toHaveLength(2);
  });
  it('doubles once and settles twice the base unit', () => {
    const done = finish(takeAction(finishDealing(round('5', '10', '6', '8', 'K')), 'Double'));
    expect(done.game.hands[0].cards).toHaveLength(3);
    expect(done.results[0]).toMatchObject({ outcome: 'win', net: 2 });
  });
  it('finishes split aces automatically and pays split 21 at 1:1', () => {
    const done = finish(takeAction(finishDealing(round('A', '10', 'A', '8', 'K', '9')), 'Split'));
    expect(done.results.map(r => r.net)).toEqual([1, 1]);
    expect(done.results.map(r => r.outcome)).toEqual(['win', 'win']);
  });
  it('continues the other split hand after a bust and settles mixed results', () => {
    const split = takeAction(finishDealing(round('8', '10', '8', '8', 'K', '2', 'K', '9')), 'Split');
    const busted = takeAction(split, 'Hit');
    expect(busted.game.activeHand).toBe(1);
    expect(busted.phase).toBe('player-turn');
    const hit = takeAction(busted, 'Hit');
    const done = finish(takeAction(hit, 'Stand'));
    expect(done.results.map(r => r.net)).toEqual([-1, 1]);
  });
});
