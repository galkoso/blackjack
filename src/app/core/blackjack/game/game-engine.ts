import { Action, Card, GameState, Hand, Rules } from '../models';
import { calculateHand, isBlackjack, isPair } from './hand';
import { drawCard } from './deck';
export function legalActions(hand: Hand, rules: Rules, handCount = 1): Action[] {
  if (hand.stood || hand.doubled || hand.splitAces || calculateHand(hand.cards).value >= 21) return [];
  const actions: Action[] = ['Hit', 'Stand'];
  if (hand.cards.length === 2 && (!hand.fromSplit || rules.doubleAfterSplit)) actions.push('Double');
  if (isPair(hand.cards) && handCount < rules.maxHands) actions.push('Split');
  return actions;
}
export function dealGame(shoe: readonly Card[]): GameState {
  if (shoe.length < 4) throw new Error('At least four cards are required');
  const hand: Hand = { cards: [shoe[0], shoe[2]] };
  const dealer = [shoe[1], shoe[3]];
  return { shoe: shoe.slice(4), hands: [hand], dealer, activeHand: 0, finished: isBlackjack(hand) || isBlackjack({ cards: dealer }) };
}
export function applyAction(state: GameState, action: Action, rules: Rules): GameState {
  const hand = state.hands[state.activeHand];
  if (state.finished || !hand || !legalActions(hand, rules, state.hands.length).includes(action)) throw new Error('Illegal action');
  const hands = [...state.hands];
  const shoe = { cards: [...state.shoe] };
  const draw = (): Card => { const result = drawCard(shoe.cards); shoe.cards = result.shoe; return result.card; };
  if (action === 'Split') {
    const splitAces = hand.cards[0].rank === 'A';
    hands.splice(state.activeHand, 1, ...hand.cards.map(card => ({ cards: [card, draw()], fromSplit: true, splitAces })));
  } else if (action === 'Stand') hands[state.activeHand] = { ...hand, stood: true };
  else hands[state.activeHand] = { ...hand, cards: [...hand.cards, draw()], doubled: action === 'Double' };
  const nextHandOffset = hands.slice(state.activeHand).findIndex(candidate => legalActions(candidate, rules, hands.length).length > 0);
  const activeHand = nextHandOffset === -1 ? hands.length : state.activeHand + nextHandOffset;
  return { ...state, shoe: shoe.cards, hands, activeHand, finished: activeHand === hands.length };
}
export function playDealer(state: GameState): GameState {
  if (!state.finished) throw new Error('Player hands must finish first');
  const shoe = { cards: [...state.shoe] };
  const dealer = [...state.dealer];
  while (calculateHand(dealer).value < 17) { const result = drawCard(shoe.cards); dealer.push(result.card); shoe.cards = result.shoe; }
  return { ...state, shoe: shoe.cards, dealer };
}
/** Net return per original unit; doubles multiply the settlement, split 21 is not blackjack. */
export function settleHand(hand: Hand, dealer: readonly Card[], rules: Rules): number {
  const player = calculateHand(hand.cards).value;
  const house = calculateHand(dealer).value;
  const natural = isBlackjack(hand);
  const dealerNatural = isBlackjack({ cards: dealer });
  const stake = hand.doubled ? 2 : 1;
  if (player > 21) return -stake;
  if (dealerNatural) return natural ? 0 : -stake;
  if (natural) return rules.blackjackPayout;
  if (house > 21 || player > house) return stake;
  return player === house ? 0 : -stake;
}
