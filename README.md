# Blackjack Basic Strategy Trainer

Frontend-only Angular 22.1.6, standalone components, signals, strict TypeScript, SCSS and Hebrew RTL. No accounts, backend, database, remote fonts or runtime network dependencies.

## Run

Node 22.22.3 or a newer Angular-compatible Node version is required.

```sh
npm ci
npm start
# http://localhost:4200
npm test
npm run build
```

Production files are written to `dist/trainer/browser`. Serve that directory with any static web server. The relative base URL also supports an embedded web view. `.npmrc` selects the legacy peer resolver to avoid an npm 10 Arborist crash involving optional Angular build/Vitest peer dependencies; all direct dependencies are explicitly installed and locked.

## Architecture

- `src/app/core/blackjack/models`: immutable data contracts and rules.
- `src/app/core/blackjack/game`: shoes, seeded RNG, hand evaluation, legal actions, immutable split/double/hit/stand transitions, S17 dealer play and 3:2 settlement.
- `src/app/core/blackjack/strategy`: explicit deck-specific tables and deterministic recommendations with Hebrew explanations.
- `src/app/services`: Angular signal orchestration, statistics and settings. The `PERSISTENCE` token is the only storage boundary.
- `src/app/components`: presentation and action events. No blackjack rules in components.

The core has no Angular, browser or storage dependencies. Shuffle takes an injected RNG; tests use a seeded generator. The Angular service supplies `Math.random` for training exercises.

## Playable rounds with strategy coaching

Each round uses a freshly shuffled shoe with the selected deck count. Cards are dealt player → dealer → player → dealer, with the second dealer card face-down. Naturals are included and resolved after the initial deal and reveal, without fabricating a player decision. This models the American hole-card/peek game.

The pure `game/round-engine.ts` exposes `startRound`, `finishDealing`, `takeAction` and `stepDealer`. Its explicit phases are `dealing`, `player-turn`, `dealer-turn` and `round-complete`. `stepDealer` draws at most one card per call, stands on hard and soft 17, and produces individual hand outcomes and unit settlements. It avoids unnecessary dealer draws after a natural or when every player hand has busted.

Hit adds a card; Stand advances to the next unfinished hand; Double draws exactly one card and doubles that hand's stake; Split creates independently playable hands and supports DAS. The table highlights the current hand and displays all split-hand results. The round banner reports the net result across hands. The base stake is one practice unit per hand, so a natural pays +1.5 and a doubled win pays +2. There is no real money or bankroll system.

Every legal player decision is graded against the separate strategy engine **before** it is applied. Incorrect decisions still execute normally. Feedback never blocks the next legal decision. Every decision, including subsequent hits and split-hand decisions, updates the persisted statistics. Naturals do not count as decisions.

The Angular game service controls presentation timing and visible-card counts. Initial cards appear 260 ms apart; card entry takes 360 ms; the hole card flips before dealer draws; dealer hits are spaced 480 ms apart. Card origins are measured from the rendered shoe by the playing-card component, with CSS slide/scale/shadow and 3D flip effects. Reduced-motion preferences disable visual motion. Action buttons remain disabled throughout dealing, action animations and the dealer turn. Only a completed round exposes **יד חדשה**. Starting a new round after a deck-setting change cancels pending timers; destroying the service cancels animation work as well.

Statistics aggregate across deck settings and retain the latest ten decisions with their deck counts. Settings and statistics persist in versioned localStorage keys. Invalid or unavailable storage falls back safely to in-memory state. Active rounds are not persisted. Rules are captured at the beginning of each round. Changing decks explicitly replaces the current round; cancelling settings leaves it running.

## Strategy rules and sources

Verified against Michael Shackleford's Wizard of Odds S17 charts:

- [Single deck](https://wizardofodds.com/games/blackjack/strategy/1-deck/)
- [Double deck](https://wizardofodds.com/games/blackjack/strategy/2-decks/)
- [Four to eight decks](https://wizardofodds.com/games/blackjack/strategy/4-decks/)

Assumptions: dealer stands on all 17; double on any initial two cards; DAS enabled in the UI; no surrender, insurance or side bets; split equal-value cards up to four hands; split aces receive exactly one card and cannot be resplit. Split 21 pays 1:1, natural blackjack pays 3:2. The core supports disabling DAS and the tables include its split/double fallbacks, though the initial UI intentionally fixes DAS on.

The implementation uses the published **total-dependent** basic strategy charts, not card counting or composition-dependent deviations. It preserves the chart's single-deck 7,7 versus 10 stand exception. Single-deck soft 18 versus A stands; double-deck soft 18 versus A hits, matching the published chart and two-card discussion. Surrender cells use their indicated Hit/Stand fallback because surrender is unavailable. Double cells carry explicit Hit or Stand fallbacks when doubling is illegal. Busts, naturals and completed hands have no recommendation and are rejected by the strategy API.

Chart sources were checked on 2026-09-12. Table columns are dealer values 2 through 10, then ace.

The Hebrew explanations describe the reason for the table action without inventing percentages or claiming a guaranteed winning outcome.

## Native mobile apps with Capacitor

The Angular production output is packaged from `dist/trainer/browser`. The application remains frontend-only, works from its bundled assets offline, and continues to store settings and statistics in `localStorage` inside the native WebView.

```bash
ng build
npx cap sync

npx cap open ios
npx cap open android
```

After future Angular changes, use this workflow:

```text
change Angular code → build → cap sync → open/test native app
```

You can also run `npm run build:mobile` to perform the production build and Capacitor sync together. Use `npm run cap:ios` or `npm run cap:android` to open a native project.

## Tests

`npm test` runs 41 pure TypeScript unit tests, including every requested example, deck-specific differences, DAS and double fallbacks, multiple aces, shoe multiplicities, deterministic shuffle, immutable transitions, split-ace restrictions, settlement and an exhaustive legal-action check across initial rank combinations and all deck settings.

`npm run build` also performs strict Angular template and TypeScript compilation.

## Future Capacitor wrapper

The browser build can be used as Capacitor's `webDir: 'dist/trainer/browser'`. Add the Capacitor packages and native iOS/Android projects when ready, run the production build, then sync native projects. No core rewrite is required. Replace the `PERSISTENCE` provider with a native adapter if desired; initialize asynchronous native preferences before bootstrapping Angular or supply a synchronous in-memory cache. No native projects or store publishing are part of this frontend build.

Validation: 53 pure-core tests and eight Angular service integration tests (61 total) pass. Coverage includes phased dealing, duplicate-click rejection, incorrect actions continuing play, sequential dealer draws, split/DAS, naturals, mixed settlements, timer cancellation, and persistence. The production build passes. Headless Chromium layout regression checks and screenshot QA now cover desktop and mobile card placement and face orientation. Run `npm run test:e2e` (first install Chromium with `npx playwright install chromium`).

Accessibility includes native buttons, descriptive card labels, visible focus states, a native modal dialog with focus trapping/Escape dismissal, radio controls, a live feedback region, and reduced-motion support.

## Card-layout regression (2026-09-12)

Root cause: a running dev server retained the old global stylesheet entries, so newly added gameplay layout/flip styles were absent. All styles now enter through `src/styles.scss` using ordered SCSS modules (`base`, `casino`, `gameplay`). A conflicting legacy dealer-card transform also reset the first card back to face forward; that transform was removed.

`npm run test:e2e` uses a deterministic shoe and checks the real app at desktop/mobile widths: dealer above player, player immediately above the action buttons, overlapping front/back rectangles, and correct back-face rotation. This browser-level check catches layout failures that the pure game tests and Angular compilation cannot detect.
