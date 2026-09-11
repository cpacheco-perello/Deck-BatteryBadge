# DGS Battery

[![Chat](https://img.shields.io/badge/chat-on%20discord-7289da.svg)](https://streamingtech.co.nz/discord)

This project is a community-maintained fork of the Deck Settings plugin for Decky Loader. It fetches and displays community-driven game compatibility and configuration reports directly from the [Deck Settings API](https://deckverified.games/). These reports, sourced from the open-source [game-reports-steamos repository](https://github.com/DeckSettings/game-reports-steamos), provide optimized performance tweaks, graphics settings, and compatibility information for handheld gaming devices like the Steam Deck.

On top of the original plugin, this fork adds a battery badge on the game details page that estimates battery life from community reports, and can read per-game average power from the Battery Tracker plugin when it is installed.

## Features
- Fetches game compatibility reports for devices like Steam Deck, ROG Ally, and others.
- Provides configuration tips, performance tweaks, and compatibility ratings for individual games.
- Allows users to search by game name or Steam App ID.
- Shows an estimated battery life badge on the game page, pinned to the corner you choose.

## Install

Decky Loader installs plugins from a URL. Enable Developer Mode under Settings → General, then open the Developer tab and use **Install Plugin from URL**.

Test builds, rebuilt on every push to `develop`:

```
https://github.com/cpacheco-perello/Deck-BatteryBadge/releases/download/develop-latest/dgs-battery.zip
```

Stable builds, published from `main`:

```
https://github.com/cpacheco-perello/Deck-BatteryBadge/releases/download/latest/dgs-battery.zip
```

Both links are permanent. The file behind each one is replaced by CI, so reinstalling from the same URL always gets the newest build of that branch.

If you are coming from the original Deck Settings plugin, uninstall it first. The two used to share an identity in Decky, and older installs can leave a stale folder behind in `~/homebrew/plugins`.

## Developers

### Dependencies

This relies on the user having Node.js v16.14+ and `pnpm` (v9) installed on their system.  
Please make sure to install pnpm v9 to prevent issues with CI during plugin submission.  
`pnpm` can be downloaded from `npm` itself which is recommended.

#### Linux

```bash
npm i -g pnpm@9
```

### Building This Fork

1. Clone the repository.
2. In your local fork/own plugin-repository run these commands:
   1. ``pnpm i``
   2. ``pnpm run build``
      - These setup pnpm and build the frontend code for testing.
3. Use the [decky-frontend-lib](https://github.com/SteamDeckHomebrew/decky-frontend-lib) documentation to integrate additional functionality as needed.
4. If using VSCodium/VSCode, run the `setup` and `build` and `deploy` tasks. If not using VSCodium etc. you can derive your own makefile or just manually utilize the scripts for these commands as you see fit.

If you use VSCode or it's derivatives (we suggest [VSCodium](https://vscodium.com/)!) just run the `setup` and `build` tasks. It's really that simple.

#### Rebuilding After Code Changes

Everytime you change the frontend code (`index.tsx` etc) you will need to rebuild using the commands from step 2 above or the build task if you're using vscode or a derivative.

Note: If you are receiving build errors due to an out of date library, you should run this command inside of your repository:

```bash
pnpm update @decky/ui --latest
```

## Acknowledgements

- Original project: Deck Settings by Josh.5 (Josh Sunnex).
- Community data source: [DeckSettings/game-reports-steamos](https://github.com/DeckSettings/game-reports-steamos).
- This fork continues under the same BSD-3-Clause license terms in [LICENSE](LICENSE).
