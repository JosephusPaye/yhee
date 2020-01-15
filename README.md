# Yhee

Yhee is a time tracking browser extension that tracks how much time you spend on different websites and webpages, and displays the results in beautiful charts. All tracked data is completely local and never leaves your computer.

This project is part of [#CreateWeekly](https://dev.to/josephuspaye/createweekly-create-something-new-publicly-every-week-in-2020-1nh9), my attempt to create something new publicly every week in 2020.

## How to use

### Setup

- Install the extension.
- Visit each domain you want to track, click the extension icon in the browser toolbar, then click **Track this domain**.
- The browser will prompt you to give Yhee permission to access the domain, and if you allow, Yhee will start tracking the time you spend on that domain.

### View reports

- To see how much time you've spent on a domain for the day, visit the domain, and click the extension icon.
- To see detailed charts for today, for the week, and for all time, click the extension icon, then click **Dashboard**.

### Stop tracking

To stop tracking a domain, visit the domain, click the extension icon, and then click **Don't track this domain**.

_Note: previously tracked data for the domain will still remain in Yhee, until you clear your browsing data._

## Design

The main idea behind the tracker in Yhee is the concept of "heartbeats". Heartbeats are timestamped events that are generated when you interact with a webpage on a domain that's tracked by Yhee.

For reporting, heartbeats are aggregated into "durations" (timespans with a start and an end) by combining consecutive heartbeats that are within a certain timeout threshold of each other. By default, this threshold is 15 minutes.

This means that if you load a page and scroll around for 2 minutes, switch to another tab or program and do something else for 15 minutes, then switch back and type for 1 minute, the duration generated will be `2 + 15 + 1` (18) minutes long. If instead you spent more than 15 minutes away from the tab, the generated duration will be `2 + 1` (3) minutes long.

This design was largely inspired by [WakaTime](https://wakatime.com/dashboard)'s approach to time tracking.

## Tracking details

Yhee tracks the following document events and generates heartbeats that indicate when you're active on a page:

- `scroll`
- `click`
- `keypress`
- `mousemove`

For performance reasons, these events are throttled to 5-second intervals, and generate at most one heartbeat every 2 minutes.

Additionally, these tab lifecycle events are tracked without throttling:

- `load`
- `unload`
- `focus`
- `blur`

Each heartbeat stores the the type of event that triggered it, the current time, origin, path, and title of the page at the time the event was triggered. The following is the heartbeat generated when you visit GitHub's notifications page:

```json
{
  "origin": "https://github.com",
  "path": "/notifications",
  "time": 1579004038495,
  "title": "Notifications",
  "type": "load"
}
```

## Todo

### For [#CreateWeekly](https://dev.to/josephuspaye/createweekly-create-something-new-publicly-every-week-in-2020-1nh9)

- [x] Collect and store heartbeats and activity data for domains and pages
- [x] Make popup show total time spent today on the active site
- [x] Add dashboard UI with basic "top domains" chart
- [x] Add support for opt-in (track only an allowed list of domains)
- [x] Add support for opt-out (stop tracking an allowed domain)
- [x] Switch to better storage and querying system: e.g. IndexedDB

### Maybe later (contributions welcome)

- [ ] Make timeout threshold a configurable setting
- [ ] Add ability to view all tracked domains in dashboard, and remove a tracked domain with its data
- [ ] Add more charts
  - [ ] Per-domain chart showing top pages
  - [ ] Duration chart that shows what times of the day the each domain/page was visited
- [ ] Add dark mode for the popup and dashboard, and automatically switch based on current browser/OS setting
- [ ] Add a syncing system to share data across devices
- [ ] Add export option: export heartbeat data as JSON
- [ ] Rewrite in TypeScript (currently has JSDoc types that are checked by TypeScript in VSCode)

## Contributing

See [contribution guide](CONTRIBUTING.md).

## Licence

[MIT](LICENCE)
