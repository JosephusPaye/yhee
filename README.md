# Yhee

Time tracking browser extension.

## Project setup

```
yarn install
```

### Compiles for production

```
yarn build
```

### Lints and fixes files

```
yarn lint
```

## Details

### `src/content.js`

Implements the extension content script. This file is injected into matching web pages to track
user interaction and save "heartbeats" that will be used to calculate total time spent on pages.

### `src/popup.(js|vue)`

Implements the UI and functionality for the popup that shows when clicking the extension button in
the browser toolbar.

### `src/dashboard.(js|vue)`

Implements the dashboard UI and functionality.

### `public/icon*.png`

The extension icons.

### `public/manifest.json`

The extension manifest, speficies name, version, icons, popup script, content script, and permissions.

### `public/index.html`

The main HTML entry point, used by the dashboard and popup pages as templates when building.

## Todo

For #CreateWeekly

- Make popup show total time spent today on the active site
- Add dashboard UI with basic charts (showing domains and pages under those domains),
  with a persisted setting for timeout preference
- Add support for all domains

Maybe later, if there's time

- Add support for opt-in (track only an allowed list of domains)
  and opt-out (track all except a disallowed list of domains)
- Switch to better storage and querying system: e.g. IndexedDB
- Collapse heartbeats into durations to save space after 24 hours
- Add support for the browser's darkmode in popup and dashboard
- Add a browser sync system
