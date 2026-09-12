import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';
import { Card } from '../../core/blackjack/models';

@Component({
  selector: 'app-playing-card', changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './playing-card.component.html', host: { class: 'dealt-card' },
})
export class PlayingCardComponent {
  readonly card = input<Card>(); readonly hidden = input(false);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => {
      const host = this.element.nativeElement;
      const shoe = host.closest('.felt')?.querySelector('.shoe-decoration');
      if (!shoe) return;
      // Geometry only: the card starts at the actual shoe position at every viewport size.
      const origin = shoe.getBoundingClientRect();
      const target = host.getBoundingClientRect();
      host.style.setProperty('--deal-x', `${origin.left - target.left}px`);
      host.style.setProperty('--deal-y', `${origin.top - target.top}px`);
      host.classList.add('card-in-flight');
    });
  }
}
