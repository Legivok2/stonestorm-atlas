# StoneStorm Workspace 0.3.0 – mode-switch acceptance

## Result

The Workspace now starts in **Játék** mode by default with one original game `WebContentsView` plus the separate local toolbar view. Switching to **Tárnák – 4 panel** reuses that primary game view and creates three more. Returning to Játék closes the three secondary game views, restores the primary's original presentation, and returns to the previous safe game page when possible.

The four-panel mining implementation was preserved. The workspace mode manager serializes mode changes and makes repeated requests idempotent. Local settings cover opt-in last-workspace startup, mining layout, panel sizes, compact presentation, and fullscreen.

## Automated verification

Latest local run:

- `npm test`: **17/17 passed** (policy and mode-manager unit tests).
- `npm run test:electron`: **32/32 passed** across the local native Electron runtime and mode-switch suites.
- Mode-switch test includes **30 GAME ↔ MINING cycles**; each cycle checks that retired WebContents are destroyed, only one game remains in GAME mode, view and IPC counts stay stable, and the same primary ID is retained.
- The runtime suite also verifies a synthetic `HttpOnly` cookie survives an actual Electron restart using its isolated profile.

These are local synthetic-page tests. They do not authenticate to Stonestorm, consume game resources, or establish that a live signed-in session has been preserved.

## Memory measurement note

The initial 30-cycle check summed process working sets and exceeded its 256 MiB threshold. Per-process diagnostics showed the total working set reaching about 950 MiB, while process count stayed at five, all retired game WebContents were destroyed, and summed process-private bytes stayed near 245–255 MiB. On Windows, working-set totals include shared/resident pages and are not a suitable proxy for retained private allocations in this test.

The check now records both values, asserts stable process count, and applies the 256 MiB post-warmup allowance to summed `privateBytes`. In the latest passing run, private bytes were 241,148 KiB initially, peaked at 250,356 KiB, and ended at 244,912 KiB. Working-set peak was 949,196 KiB and is still recorded as diagnostic, not represented as a memory cap or live-game benchmark.

## Live use and known limits

- The primary `WebContentsView` and shared Workspace session are preserved by implementation and verified in a synthetic Electron session. Actual authenticated live-game retention has not been tested in this run.
- Normal-game navigation and HUD restoration are tested against the synthetic original-page fixture. Manual live sign-in, external OAuth/popup flows, and live game acceptance remain unverified.
- In Tárnák mode the four original game documents retain their own game state. Automatic immediate inventory synchronization between those separate client instances is not guaranteed.
- No game client files were modified, no direct game API calls were added, and tests did not perform resource-consuming actions.
- The Windows x64 package was built for 0.3.0 with Electron 45.4.1 using Node 22.12.0. Its read-only `--workspace-probe` launch used a fresh temporary profile, started in GAME with one game view, and loaded the public landing page with HTTP 200. No sign-in or game action was performed; this does not verify a live authenticated session. Build metadata and SHA-256 hashes are in `reports/windows-build.json`.

Detailed local run data is written by the test scripts to `reports/runtime-test.json` and `reports/modes-runtime.json`.
