import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Decision } from '../../services/statistics.service';

@Component({
  selector: 'app-recent-decisions', changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recent-decisions.component.html',
})
export class RecentDecisionsComponent { readonly decisions = input.required<readonly Decision[]>(); }
