# Complex 4-7

Design doc: `Readme.md` (the source of truth for design). This file records build conventions.

## Stack
- TypeScript + Vite, no game engine. Terminal HMI drawn on a canvas character grid (100x36).
- `npm run dev` / `npm test` (Vitest) / `npm run build`. Deployed to GitHub Pages by `.github/workflows/deploy.yml` on push to main.
- node_modules is a junction to a temp folder on the dev machine because OneDrive corrupts large npm installs. If installs break, delete it and recreate the junction outside OneDrive.

## Two front ends, one simulation
- `src/main.ts` picks one: touch-first or narrower than 900px gets mobile; `?ui=mobile|desktop` overrides.
- Desktop: `src/desktop.ts` + `src/ui/` (canvas grid, keyboard first).
- Mobile: `src/mobile/` (`views.ts` pure HTML-string views, `app.ts` loop/taps/docs, `mobile.css`). Taps resolve on pointerup from the id captured at pointerdown, so repaints never eat a tap. Regions repaint at ~8 Hz only when their HTML changes. Haptics, screen wake lock, installable via `public/manifest.webmanifest`.
- `src/shell.ts` holds what both share (game creation, sound/haptic cues).
- Dev URL params: `?jump=HHMM` boots into play at that time (autopilot plays up to it), `&page=F1..F9`, mobile only: `&proc=TO%204-3`, `&sheet=1`, `&doc=debrief|changeover|manual`.
- Screenshots: headless Edge has a ~500px minimum window, so frame the page in a 390px iframe for phone shots.
- `dist/` inside OneDrive sometimes fails to build with a silent exit 5 (file lock); just rerun.

## Layout
- `src/sim/` - simulation core, no DOM. `game.ts` (plant, clock, traffic, crew, procedures, scoring), `debrief.ts`, `autopilot.ts` (stand-in crew for tests and the playtest jump), `time.ts`.
- `src/content/` - data: `messages.ts` (teletype traffic), `procedures.ts` (checklists with check functions), `script.ts` (shift timeline), `binder.ts` (static pages).
- `src/ui/` - `screen.ts` (grid), `renderer.ts` (canvas), `pages.ts` (F-key pages), `docs.ts` (full-screen documents), `audio.ts` (WebAudio synth).

## Rules
- Simulation never imports UI. UI reads state and calls Game command methods.
- Indications (`g.ind`) are what instruments show; checklist confirm steps check `g.lamp()` (true lamp, not the point-test pattern).
- Time: calm periods run at `calmRate` (240x, `?rate=` in URL); anything in `Game.isEngaged()` drops to 1x.
- Colour is for state only. No modern references in game text. Violence reported, never shown.
- URL params: `?rate=N`, `?seed=N`. Title screen option 2 jumps to 0145Z via the autopilot (playtesting).

## Status
Milestone 1 (terminal HMI prototype, one composite shift) built. F5 Door and F7 Launch are placeholders.
