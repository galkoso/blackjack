import { Action, Card, HandResult, RoundState, Rules } from '../models';
import { applyAction, dealGame, settleHand } from './game-engine';
import { calculateHand, isBlackjack, isBust } from './hand';
import { drawCard } from './deck';

/** Rules are captured per round; presentation acknowledges the end of dealing. */
export function startRound(shoe: readonly Card[], rules: Rules): RoundState {
  return { phase: 'dealing', game: dealGame(shoe), rules: { ...rules }, results: [] };
}
export function finishDealing(round: RoundState): RoundState {
  if (round.phase !== 'dealing') throw new Error('Round is not dealing');
  return { ...round, phase: round.game.finished ? 'dealer-turn' : 'player-turn' };
}
export function takeAction(round: RoundState, action: Action): RoundState {
  if (round.phase !== 'player-turn') throw new Error('Not the player turn');
  const game = applyAction(round.game, action, round.rules);
  return { ...round, game, phase: game.finished ? 'dealer-turn' : 'player-turn' };
}
/** One deterministic dealer step per call allows the UI to animate individual draws. */
export function stepDealer(round: RoundState): RoundState {
  if (round.phase !== 'dealer-turn') throw new Error('Not the dealer turn');
  const { game, rules } = round;
  const natural = isBlackjack({ cards: game.dealer }) || game.hands.some(isBlackjack);
  const allBust = game.hands.every(hand => isBust(hand.cards));
  if (!natural && !allBust && calculateHand(game.dealer).value < 17) {
    const { card, shoe } = drawCard(game.shoe);
    return { ...round, game: { ...game, shoe, dealer: [...game.dealer, card] } };
  }
  const results: HandResult[] = game.hands.map(hand => {
    const net = settleHand(hand, game.dealer, rules);
    return {
      outcome: isBust(hand.cards) ? 'bust' : net === 0 ? 'push' : net < 0 ? 'loss' : isBlackjack(hand) ? 'blackjack' : 'win',
      playerValue: calculateHand(hand.cards).value, dealerValue: calculateHand(game.dealer).value, net,
    };
  });
  return { ...round, phase: 'round-complete', results };
}
