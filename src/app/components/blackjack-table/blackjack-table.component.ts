import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Action, Card, Outcome, RoundPhase } from '../../core/blackjack/models';
import { HandView } from '../../services/blackjack-game.service';
import { PlayingCardComponent } from '../playing-card/playing-card.component';
import { ActionButtonsComponent } from '../action-buttons/action-buttons.component';
@Component({
  selector: 'app-blackjack-table', imports: [PlayingCardComponent, ActionButtonsComponent], changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blackjack-table.component.html',
})
export class BlackjackTableComponent {
  readonly hands = input.required<readonly HandView[]>(); readonly dealer = input.required<readonly Card[]>();
  readonly dealerLabel = input.required<string>(); readonly revealed = input(false); readonly phase = input.required<RoundPhase>();
  readonly status = input.required<string>(); readonly title = input(''); readonly net = input(0);
  readonly legal = input.required<readonly Action[]>(); readonly choose = output<Action>(); readonly next = output<void>();
  readonly outcomes: Record<Outcome, string> = { win: 'ניצחת', loss: 'הבית ניצח', push: 'תיקו', blackjack: 'בלאק ג׳ק', bust: 'עברת 21' };
}
