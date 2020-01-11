import throttle from 'lodash.throttle';

/**
 * @typedef {Object} Heartbeat
 * @property {string} type - The type of event that triggered the heartbeat
 * @property {number} time - The time of the heartbeat, in ms since the epoch
 * @property {string} origin - The origin of the page at the time of the heartbeat
 * @property {string} path - `location.pathname + location.search` of the page at the time of the heartbeat
 * @property {string} title - `document.title` of the page at the time of the heartbeat
 */

/**
 * @type {function[]}
 */
let cleanUpFunctions = [];

/**
 * @type {?Heartbeat}
 */
let lastHeartbeat = undefined;

/**
 * Create a heartbeat of the given type and for the given time.
 *
 * @param   {string}  type  The type of event that triggered the heartbeat
 * @param   {number}  time  The current time, in ms since the epoch
 *
 * @return  {Heartbeat}     The heartbeat
 */
function createHeartbeat(type, time = Date.now()) {
  const origin = location.origin;
  const path = location.pathname + location.search;
  const title = document.title;

  return {
    type,
    time,
    origin,
    path,
    title,
  };
}

/**
 * Save the given heartbeat to local storage for later aggregation and display.
 *
 * @param   {Heartbeat}  heartbeat  The heartbeat
 */
function saveHeartbeat(heartbeat) {
  console.log('saving heartbeat', heartbeat.type, heartbeat.time);

  chrome.storage.local.get({ heartbeats: [] }, function({ heartbeats }) {
    heartbeats.push(heartbeat);
    chrome.storage.local.set({ heartbeats }, function() {
      if (lastHeartbeat) {
        console.log(
          'time between last save',
          heartbeat.time - lastHeartbeat.time
        );
      }
      console.log('saved heartbeat', heartbeat);
      lastHeartbeat = heartbeat;
    });
  });
}

/**
 * Handle an event that might trigger a heartbeat.
 *
 * @param   {string}  event  The event name
 */
function onEvent(event) {
  console.log('event triggered', event);

  const now = Date.now();

  // For "lifecycle" events, save a heartbeat immediately
  if (['load', 'focus', 'blur', 'unload'].includes(event)) {
    saveHeartbeat(createHeartbeat(event, now));

    // Clean up listeners if we're unloading
    if (event === 'unload') {
      console.log('Cleaning up content script to unload');
      for (const cleanUp of cleanUpFunctions) {
        cleanUp();
      }
    }

    return;
  }

  // For other "interaction" events, save heartbeats on a 2-min interval
  // except when the page url has changed

  const hasLastHeartbeat = lastHeartbeat !== undefined;
  const enoughTimePassed = hasLastHeartbeat
    ? lastHeartbeat.time + 120000 < now
    : false;
  const pageUrlChanged = hasLastHeartbeat
    ? lastHeartbeat.path !== location.pathname + location.search
    : false;

  if (hasLastHeartbeat === false || pageUrlChanged || enoughTimePassed) {
    saveHeartbeat(createHeartbeat(event, now));
  }
}

/**
 * Listen for the given events on the given target.
 *
 * @param   {(window|document|HTMLElement)}  target   The target to attach listeners to
 * @param   {string[]}  events                        One or more events to listen for
 * @param   {boolean}  options.throttle               Whether or not to throttle the listeners
 *
 * @return  {function[]}                              An array of cleanup functions
 */
function listen(target, events, options = { throttle: false }) {
  return events.map(eventName => {
    let handler = () => {
      onEvent(eventName);
    };
    handler = options.throttle
      ? throttle(handler, 750, { leading: true, trailing: true })
      : handler;
    target.addEventListener(eventName, handler, { passive: true });
    return () => {
      target.removeEventListener(eventName, handler, { passive: true });
    };
  });
}

// Listen for "lifecyle" events
cleanUpFunctions.push(...listen(window, ['focus', 'blur', 'unload']));

// Listen for "interaction" events
cleanUpFunctions.push(
  ...listen(document, ['scroll', 'click', 'keypress', 'mousemove'], {
    throttle: true,
  })
);

// Trigger the initial load event
onEvent('load');
