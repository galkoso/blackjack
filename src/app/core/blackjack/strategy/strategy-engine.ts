import { Card, Hand, Rules, StrategyResult, Action } from '../models';
import { calculateHand, cardValue, isPair } from '../game/hand';
import { legalActions } from '../game/game-engine';
import { Cell, DOUBLE_DECK, MULTI_DECK, SINGLE_DECK } from './strategy-tables';

export function getOptimalAction(playerHand: Hand, dealerUpCard: Card, rules: Rules, handCount = 1): StrategyResult {
  const legal = legalActions(playerHand, rules, handCount);
  if (!legal.length) throw new Error('No decision exists for a completed hand');
  const { value, soft } = calculateHand(playerHand.cards);
  const pair = isPair(playerHand.cards);
  const table = rules.decks === 1 ? SINGLE_DECK : rules.decks === 2 ? DOUBLE_DECK : MULTI_DECK;
  const dealer = cardValue(dealerUpCard);
  const handType = pair ? 'pair' : soft ? 'soft' : 'hard';
  const fallback = (soft ? table.soft[value] : table.hard[value]) ?? 'HHHHHHHHHH';
  const row = pair && legal.includes('Split') ? table.pair[cardValue(playerHand.cards[0])] : fallback;
  const cell = ((row[dealer - 2] as Cell) === 'p' ? (rules.doubleAfterSplit ? 'P' : 'H')
    : (row[dealer - 2] as Cell) === 'q' ? (rules.doubleAfterSplit ? 'P' : 'D') : row[dealer - 2]) as Cell;
  const recommendedAction: Action = cell === 'P' ? 'Split' : cell === 'S' ? 'Stand' : cell === 'D' || cell === 'd'
    ? legal.includes('Double') ? 'Double' : cell === 'd' ? 'Stand' : 'Hit' : 'Hit';
  const kind = handType === 'pair' ? 'זוג' : soft ? 'יד רכה' : 'יד קשה';
  const reason: Record<Action, string> = { Hit: 'לקיחת קלף נותנת ליד הזדמנות להשתפר מול קלף הבית.', Stand: 'עמידה שומרת על היד ומנצלת את הסיכוי של הבית להפסיד.', Double: 'הכפלה מאפשרת לקבל קלף אחד נוסף כשהמצב מתאים לכך.', Split: 'פיצול הופך זוג לשתי ידיים נפרדות עם תוחלת טובה יותר.' };
  return { recommendedAction, playerValue: value, handType, explanation: `${kind} של ${value} מול ${dealerUpCard.rank} של הבית. ${reason[recommendedAction]} לפי טבלת S17 ל־${rules.decks} חפיסות.` };
}
