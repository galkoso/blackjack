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
  const reason: Record<Action, string> = {
    Hit: soft ? 'האס יכול להיחשב גם כ־1, ולכן אפשר לנסות לשפר את היד. מול קלף הבית הזה, לקיחת קלף עדיפה על עמידה בטווח הארוך.' : value < 12 ? 'אין סיכון לעבור 21 בקלף הבא. לקיחת קלף משפרת את התוחלת של היד מול קלף הבית.' : 'גם כשיש סיכון לעבור 21, עמידה עם הסכום הזה מפסידה יותר בטווח הארוך. לקיחת קלף נותנת סיכוי לשפר את היד ומצמצמת את ההפסד הצפוי.',
    Stand: value >= 17 ? 'זו יד חזקה מספיק מול קלף הבית. הסיכון בלקיחת קלף נוסף אינו מצדיק את השיפור האפשרי, ולכן התוחלת הטובה ביותר מתקבלת בעמידה.' : 'מול קלף הבית הזה, הסיכוי של הדילר לעבור 21 הופך עמידה לעדיפה. אין צורך לסכן את היד בקלף נוסף.',
    Double: 'זו הזדמנות טובה להכפיל את ההימור ולקבל קלף אחד בלבד. השילוב של היד שלך וקלף הבית מעניק להכפלה תוחלת גבוהה יותר מהחלופות.' + (soft ? ' האס מעניק ליד גמישות, כי הוא יכול להיחשב כ־1 או כ־11.' : ''),
    Split: playerHand.cards[0].rank === 'A' ? 'שני אסים יחד מתחילים ביד רכה של 12. פיצול נותן לכל אס הזדמנות נפרדת לבנות יד חזקה.' : value === 16 ? 'זוג שמיניות יוצר 16, יד חלשה. פיצול מאפשר להתחיל שתי ידיים מ־8 ומשפר את התוחלת מול קלף הבית.' : 'מול קלף הבית הזה, שתי ידיים נפרדות נותנות תוחלת טובה יותר מהזוג המקורי. האפשרות להכפיל אחרי פיצול נלקחת בחשבון.',
  };
  return { recommendedAction, playerValue: value, handType, explanation: `${kind} של ${value} מול ${dealerUpCard.rank} של הבית. ${reason[recommendedAction]} לפי טבלת S17 ל־${rules.decks} חפיסות.` };
}
