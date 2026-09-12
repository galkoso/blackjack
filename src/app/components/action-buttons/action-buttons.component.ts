import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Action } from '../../core/blackjack/models';
@Component({
  selector: 'app-action-buttons', changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './action-buttons.component.html',
})
export class ActionButtonsComponent {
  readonly legal = input.required<readonly Action[]>();
  readonly choose = output<Action>();
  readonly buttons: readonly { action: Action; icon: string; label: string }[] = [
    { action: 'Hit', icon: '+', label: 'לקחת קלף' }, { action: 'Stand', icon: '✋', label: 'לעמוד' },
    { action: 'Double', icon: '◉', label: 'להכפיל' }, { action: 'Split', icon: '♧', label: 'לפצל' },
  ];
}
