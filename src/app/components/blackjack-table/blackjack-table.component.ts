import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Action, Card, RoundPhase } from '../../core/blackjack/models';
import { OUTCOME_LABELS } from '../../consts/outcomes.consts';
import { Feedback, HandView } from '../../services/blackjack-game.service';
import { FeedbackPanelComponent } from '../feedback-panel/feedback-panel.component';
import { PlayingCardComponent } from '../playing-card/playing-card.component';
import { ActionButtonsComponent } from '../action-buttons/action-buttons.component';

@Component({
  selector: 'app-blackjack-table', imports: [PlayingCardComponent, ActionButtonsComponent, FeedbackPanelComponent], changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blackjack-table.component.html',
})
export class BlackjackTableComponent {
  readonly hands = input.required<readonly HandView[]>(); readonly dealer = input.required<readonly Card[]>();
  readonly dealerLabel = input.required<string>(); readonly revealed = input(false); readonly phase = input.required<RoundPhase>();
  readonly status = input.required<string>(); readonly title = input(''); readonly net = input(0);
  readonly legal = input.required<readonly Action[]>(); readonly choose = output<Action>(); readonly next = output<void>();
  readonly feedback = input<Feedback | null>(null);
  readonly outcomes = OUTCOME_LABELS;
}
