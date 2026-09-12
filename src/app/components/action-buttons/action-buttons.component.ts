import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Action } from '../../core/blackjack/models';
import { ACTION_OPTIONS } from '../../consts/actions.consts';

@Component({
  selector: 'app-action-buttons', changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './action-buttons.component.html',
})
export class ActionButtonsComponent {
  readonly legal = input.required<readonly Action[]>();
  readonly choose = output<Action>();
  readonly buttons = ACTION_OPTIONS;
}
