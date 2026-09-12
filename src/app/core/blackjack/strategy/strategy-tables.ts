/** Wizard of Odds S17 charts (1, 2 and 4–8 decks), no surrender.
 * Columns: 2 3 4 5 6 7 8 9 10 A. H=hit, S=stand, D=double/hit,
 * d=double/stand, P=split, p=split with DAS/hit, q=split with DAS/double.
 * Total-dependent basic strategy, not composition-dependent deviations.
 */
export type Cell = 'H' | 'S' | 'D' | 'd' | 'P' | 'p' | 'q';
export interface StrategyTable { readonly hard: Readonly<Record<number, string>>; readonly soft: Readonly<Record<number, string>>; readonly pair: Readonly<Record<number, string>> }
const hard = { 5: 'HHHHHHHHHH', 6: 'HHHHHHHHHH', 7: 'HHHHHHHHHH', 8: 'HHHHHHHHHH', 9: 'HDDDDHHHHH', 10: 'DDDDDDDDHH', 11: 'DDDDDDDDDH', 12: 'HHSSSHHHHH', 13: 'SSSSSHHHHH', 14: 'SSSSSHHHHH', 15: 'SSSSSHHHHH', 16: 'SSSSSHHHHH', 17: 'SSSSSSSSSS', 18: 'SSSSSSSSSS', 19: 'SSSSSSSSSS', 20: 'SSSSSSSSSS', 21: 'SSSSSSSSSS' };
const soft = { 12: 'HHHHDHHHHH', 13: 'HHHDDHHHHH', 14: 'HHHDDHHHHH', 15: 'HHDDDHHHHH', 16: 'HHDDDHHHHH', 17: 'HDDDDHHHHH', 18: 'SddddSSHHH', 19: 'SSSSSSSSSS', 20: 'SSSSSSSSSS', 21: 'SSSSSSSSSS' };
const pair = { 2: 'ppPPPPHHHH', 3: 'ppPPPPHHHH', 4: 'HHHppHHHHH', 5: 'DDDDDDDDHH', 6: 'pPPPPHHHHH', 7: 'PPPPPPHHHH', 8: 'PPPPPPPPPP', 9: 'PPPPPSPPSS', 10: 'SSSSSSSSSS', 11: 'PPPPPPPPPP' };
export const MULTI_DECK: StrategyTable = { hard, soft, pair };
export const DOUBLE_DECK: StrategyTable = {
  hard: { ...hard, 9: 'DDDDDHHHHH', 11: 'DDDDDDDDDD' },
  soft: { ...soft, 12: 'HHHDDHHHHH', 13: 'HHHDDHHHHH', 14: 'HHDDDHHHHH' },
  pair: { ...pair, 6: 'PPPPPpHHHH', 7: 'PPPPPPpHHH' },
};
export const SINGLE_DECK: StrategyTable = {
  hard: { ...hard, 8: 'HHHDDHHHHH', 9: 'DDDDDHHHHH', 11: 'DDDDDDDDDD' },
  soft: { ...soft, 12: 'HHHDDHHHHH', 13: 'HHDDDHHHHH', 14: 'HHDDDHHHHH', 17: 'DDDDDHHHHH', 18: 'SddddSSHHS', 19: 'SSSSdSSSSS' },
  pair: { ...pair, 2: 'pPPPPP HHHH'.replace(' ', ''), 3: 'ppPPPPP HHH'.replace(' ', ''), 4: 'HHpqqHHHHH', 6: 'PPPPPpHHHH', 7: 'PPPPPPpHSH' },
};
