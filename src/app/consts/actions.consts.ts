import { Action } from '../core/blackjack/models';

export interface ActionOption {
  readonly action: Action;
  readonly icon: string;
  readonly label: string;
}

export const ACTION_OPTIONS: readonly ActionOption[] = [
  { action: 'Hit', icon: '+', label: 'לקחת קלף' }, { action: 'Stand', icon: '✋', label: 'לעמוד' },
  { action: 'Double', icon: '◉', label: 'להכפיל' }, { action: 'Split', icon: '♧', label: 'לפצל' },
];
