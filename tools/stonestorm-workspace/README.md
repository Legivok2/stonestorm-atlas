# StoneStorm Workspace 0.3.0

> **Development preview / fejlesztői előzetes.** This is not a final release. The currently implemented normal-game and four-panel Mines modes are preserved while additional workspaces remain under development. It uses its own versioning and changelog; Companion's 0.14.0 BETA version does not apply here.

## Magyar összefoglaló

A Stonestorm Workspace egy különálló, Electron-alapú Windows-alkalmazás. A jelenlegi 0.3.0-s fejlesztői előzetes megőrzi a normál Játék módot, a négy eredeti Tárnák panelt (Tárna, Olvasztó, Műhely, Gwangsu), a 4 × 1 és 2 × 2 elrendezést, valamint a helyben mentett felhasználói beállításokat. A Workspace kezelősávja és alkalmazásmenüje magyarul és angolul használható; az eredeti Stonestorm játékfelület nyelvét nem módosítja.

Kapcsolat: Discord `pain6089`.

A Windows desktop workspace with two modes:

- **Játék:** one full-size original game `WebContentsView`, with the original HUD and navigation. This is the default.
- **Tárnák – 4 panel:** the existing four original, interactive mining views (Tárna, Olvasztó, Műhely, Gwangsu) in a 4×1 or 2×2 layout.

The toolbar switches modes without starting another primary game instance. Returning to Játék keeps the primary view and its Electron session, closes the other three game views, removes mining presentation CSS, and returns to the earlier safe page when available. Repeated mode requests are serialized and idempotent.

## Run

1. Start `START_WORKSPACE.cmd`, or run `npm start` from this directory.
2. Sign in manually in the Workspace if needed. The Workspace uses its own persistent Electron profile at `%APPDATA%\StoneStorm Workspace`; it does not import Chrome cookies or credentials.
3. Use **Játék** and **Tárnák – 4 panel** in the toolbar to switch. In Tárnák mode, choose **4 × 1** or **2 × 2**.

The Windows launcher targets `dist\0.3.0\StoneStorm Workspace-win32-x64\StoneStorm Workspace.exe`. The full packaged directory is required. Build it with `npm run package:win`; no Node.js installation is needed to run the packaged app.

Development and packaging require Node.js 22.12 or newer and the Workspace dependencies (`npm ci`; `npm run setup:electron` when the Electron runtime is not installed yet).

## Toolbar and local settings

The compact toolbar provides mode switching, **Tárnák bezárása / Vissza a játékhoz**, Back, Refresh, Fullscreen, and Settings. Settings are stored locally in the Workspace profile and include:

- Remember the last workspace (off by default; normal game remains the default).
- 4×1 / 2×2 mining layout and panel sizes.
- Compact mining presentation and fullscreen state.

Refresh reloads the current original game page, or all four mining pages. Unsaved input may be lost; a refresh does not undo server actions. Returning from Tárnák does not close the Workspace window.

## Session, safety, and limits

All game views use the same persistent Workspace Electron session. The primary game `WebContentsView` is reused when switching modes; three secondary views are created for Tárnák and destroyed on return. No new game API, automatic game action, or client-file modification is introduced. Game pages remain sandboxed with context isolation, web security, and no Node/preload access; the local toolbar uses a separate restricted IPC bridge.

Mode switching and session reuse have been exercised in a local synthetic Electron fixture. This does **not** prove an authenticated live-game session or all game features; manual sign-in and live-game acceptance remain unverified here. The four mining views retain the game's existing independent state; immediate cross-panel inventory synchronization after a game action is not guaranteed. External OAuth/popup flows are not supported.

## Verify and package

From this directory:

```text
npm test
npm run test:electron
npm run package:win
```

The automated Electron tests use local synthetic pages and an isolated temporary profile. They do not log into the live game or consume game resources. See `reports/ACCEPTANCE.md` for the latest results and limitations.

The Workspace is documented and tested as a development preview. Packaged binaries should be distributed as GitHub Release assets rather than committed to the source repository.
