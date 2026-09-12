import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BlackjackTableComponent } from './components/blackjack-table/blackjack-table.component';
import { FeedbackPanelComponent } from './components/feedback-panel/feedback-panel.component';
import { RecentDecisionsComponent } from './components/recent-decisions/recent-decisions.component';
import { SettingsDialogComponent } from './components/settings-dialog/settings-dialog.component';
import { StatisticsPanelComponent } from './components/statistics-panel/statistics-panel.component';
import { DeckCount } from './core/blackjack/models';
import { BlackjackGameService } from './services/blackjack-game.service';
import { SettingsService } from './services/settings.service';
import { StatisticsService } from './services/statistics.service';
@Component({
  selector: 'app-root',
  imports: [BlackjackTableComponent, FeedbackPanelComponent, StatisticsPanelComponent, RecentDecisionsComponent, SettingsDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  readonly game = inject(BlackjackGameService); readonly statistics = inject(StatisticsService); readonly settings = inject(SettingsService);
  readonly settingsOpen = signal(false);
  saveSettings(decks: DeckCount): void { const changed = decks !== this.settings.decks(); this.settings.save(decks); if (changed) this.game.nextHand(); this.settingsOpen.set(false); }
}
