import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Statistics } from '../../services/statistics.service';

@Component({
  selector: 'app-statistics-panel', changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './statistics-panel.component.html',
})
export class StatisticsPanelComponent {
  readonly stats = input.required<Statistics>(); readonly accuracy = input.required<number>(); readonly clear = output<void>();
}
