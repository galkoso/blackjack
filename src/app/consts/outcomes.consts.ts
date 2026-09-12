import { Outcome } from '../core/blackjack/models';

export const OUTCOME_LABELS: Record<Outcome, string> = {
  win: 'ניצחת', loss: 'הבית ניצח', push: 'תיקו', blackjack: 'בלאק ג׳ק', bust: 'עברת 21',
};
