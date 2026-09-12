import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Feedback } from '../../services/blackjack-game.service';
@Component({
  selector: 'app-feedback-panel', changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feedback-panel.component.html',
})
export class FeedbackPanelComponent { readonly feedback = input<Feedback | null>(null); }
