import '@angular/compiler';
import { Injector } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PERSISTENCE, Persistence } from './storage';
import { SettingsService } from './settings.service';
import { StatisticsService } from './statistics.service';
import { BlackjackGameService, SHOE_FACTORY } from './blackjack-game.service';
import { Rank } from '../core/blackjack/models';
function fixture(ranks: Rank[] = ['10', '6', '6', '10', '2', '5'], saved: Record<string, unknown> = {}) {
  const memory = new Map(Object.entries(saved));
  const storage: Persistence = { read: key => memory.get(key), write: (key, value) => { memory.set(key, value); } };
  const create = () => Injector.create({
    providers: [SettingsService, StatisticsService, BlackjackGameService,
      { provide: SHOE_FACTORY, useValue: () => ranks.map(rank => ({ rank, suit: '♠' })) }, { provide: PERSISTENCE, useValue: storage }]
  });
  const injector = create();
  return { injector, create, memory, settings: injector.get(SettingsService), statistics: injector.get(StatisticsService), game: injector.get(BlackjackGameService) };
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
describe('playable training orchestration', () => {
  it('deals four cards in order and rejects premature actions', async () => {
    const { game, statistics } = fixture();
    expect(game.phase()).toBe('dealing');
    expect(game.hands()[0].cards).toHaveLength(0);
    void game.choose('Hit');
    expect(statistics.stats().total).toBe(0);
    await vi.advanceTimersByTimeAsync(100);
    expect(game.hands()[0].cards).toHaveLength(1);
    expect(game.dealerCards()).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(260);
    expect(game.dealerCards()).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(260);
    expect(game.hands()[0].cards).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(260);
    expect(game.dealerCards()).toHaveLength(2);
    expect(game.actions()).toEqual([]);
    await vi.runAllTimersAsync();
    expect(game.phase()).toBe('player-turn');
    expect(game.dealerRevealed()).toBe(false);
    expect(game.actions()).toContain('Hit');
  });
  it('executes incorrect hits, grades each decision and locks duplicate clicks', async () => {
    const { game, statistics } = fixture();
    await vi.runAllTimersAsync();
    void game.choose('Hit'); // 16 vs 6 should stand, but the player can still hit.
    void game.choose('Hit');
    expect(game.feedback()?.correct).toBe(false);
    expect(game.hands()[0].cards).toHaveLength(3);
    expect(statistics.stats().total).toBe(1);
    expect(game.actions()).toEqual([]);
    await vi.runAllTimersAsync();
    expect(game.actions()).toEqual(['Hit', 'Stand']);
    void game.choose('Stand');
    expect(game.feedback()?.correct).toBe(true);
    await vi.runAllTimersAsync();
    expect(statistics.stats()).toMatchObject({ total: 2, correct: 1, streak: 1, best: 1 });
    expect(game.phase()).toBe('round-complete');
    expect(game.round().results[0]).toMatchObject({ playerValue: 18, dealerValue: 21, net: -1 });
  });
  it('flips before drawing and draws one dealer card per animation', async () => {
    const { game } = fixture(['10', '2', '8', '3', '4', '7', '2']);
    await vi.runAllTimersAsync();
    void game.choose('Stand');
    expect(game.dealerRevealed()).toBe(false);
    await vi.advanceTimersByTimeAsync(150);
    expect(game.dealerRevealed()).toBe(true);
    expect(game.dealerCards()).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(550);
    expect(game.dealerCards()).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(480);
    expect(game.dealerCards()).toHaveLength(4);
    await vi.runAllTimersAsync();
    expect(game.dealerCards()).toHaveLength(5);
    expect(game.round().results[0].outcome).toBe('push');
  });
  it('animates split replacements separately and supports double after split', async () => {
    const { game, statistics } = fixture(['8', '6', '8', '10', '3', '2', 'K', '5']);
    await vi.runAllTimersAsync();
    void game.choose('Split');
    expect(game.hands().map(h => h.cards.length)).toEqual([1, 1]);
    await vi.advanceTimersByTimeAsync(220);
    expect(game.hands().map(h => h.cards.length)).toEqual([2, 1]);
    await vi.runAllTimersAsync();
    expect(game.actions()).toContain('Double');
    void game.choose('Double');
    await vi.runAllTimersAsync();
    expect(game.game().activeHand).toBe(1);
    expect(game.hands()[0].doubled).toBe(true);
    expect(game.hands()[0].cards).toHaveLength(3);
    void game.choose('Stand');
    await vi.runAllTimersAsync();
    expect(game.round().results.map(r => r.net)).toEqual([0, -1]);
    expect(statistics.stats().total).toBe(3);
  });
  it('deals naturals and skips player decisions', async () => {
    const { game, statistics } = fixture(['A', '6', 'K', '10']);
    await vi.runAllTimersAsync();
    expect(game.phase()).toBe('round-complete');
    expect(game.resultTitle()).toBe('בלאק ג׳ק!');
    expect(game.net()).toBe(1.5);
    expect(statistics.stats().total).toBe(0);
  });
  it('cancels stale animations when starting another round or destroying the service', async () => {
    const { game, injector, settings } = fixture();
    await vi.advanceTimersByTimeAsync(360);
    settings.save(2);
    game.nextHand();
    expect(game.hands()[0].cards).toHaveLength(0);
    await vi.runAllTimersAsync();
    expect(game.round().rules.decks).toBe(2);
    expect(game.hands()[0].cards).toHaveLength(2);
    void game.choose('Stand');
    injector.destroy();
    await vi.runAllTimersAsync();
    expect(game.dealerRevealed()).toBe(false);
  });
  it('persists decisions and settings across service recreation', async () => {
    const { game, settings, statistics, create } = fixture();
    settings.save(2);
    for (let i = 0; i < 12; i++) {
      game.nextHand();
      await vi.runAllTimersAsync();
      void game.choose('Stand');
      await vi.runAllTimersAsync();
    }
    expect(statistics.stats().recent).toHaveLength(10);
    expect(statistics.stats().recent[0].id).toBe(12);
    expect(statistics.stats().best).toBe(12);
    const reloaded = create();
    expect(reloaded.get(SettingsService).decks()).toBe(2);
    expect(reloaded.get(StatisticsService).stats()).toEqual(statistics.stats());
    reloaded.destroy();
  });
  it('rejects corrupt persisted state', () => {
    const { injector, settings, statistics } = fixture(undefined, { 'blackjack.settings.v1': 99, 'blackjack.statistics.v1': { total: -4 } });
    expect(settings.decks()).toBe(6);
    expect(statistics.stats().total).toBe(0);
    injector.destroy();
  });
});
