// @ts-check
import throttle from 'lodash.throttle';
import { log, storeHeartbeat } from './extension';

/**
 * @typedef {import('./extension').Heartbeat} Heartbeat
 */

/** @type {(function(): void)[]} */
let cleanUpFunctions = [];

/** @type {(Heartbeat|undefined)} */
let lastHeartbeat = undefined;

/**
 * Create a heartbeat of the given type for the given time.
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
  log('saving heartbeat', heartbeat.type, heartbeat.time);
  storeHeartbeat(heartbeat).then(() => {
    if (lastHeartbeat) {
      log('total time from last save', heartbeat.time - lastHeartbeat.time);
    }
    log('saved heartbeat', heartbeat);
    lastHeartbeat = heartbeat;
  });
}

/**
 * Handle an event that might trigger a heartbeat.
 *
 * @param   {string}  event  The event name
 */
function onEvent(event) {
  log('activity event triggered:', event);

  const now = Date.now();

  // For "lifecycle" events, save a heartbeat immediately
  if (['load', 'focus', 'blur', 'unload'].includes(event)) {
    saveHeartbeat(createHeartbeat(event, now));

    // Clean up listeners if we're unloading
    if (event === 'unload') {
      log('cleaning up content script to unload');
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
 * @param   {string[]} events                         One or more events to listen for
 * @param   {object}   options                        The options
 * @param   {boolean}  options.throttle               Whether or not to throttle the listeners
 * @param   {boolean}  options.capture                Whether or not to capture the events
 *
 * @return  {(function(): void)[]}                    An array of cleanup functions
 */
function listen(target, events, options = { throttle: false, capture: false }) {
  return events.map(eventName => {
    let handler = () => {
      onEvent(eventName);
    };

    handler = options.throttle
      ? throttle(handler, 5000, { leading: true, trailing: true })
      : handler;
    target.addEventListener(eventName, handler, {
      passive: true,
      capture: options.capture,
    });

    return () => {
      target.removeEventListener(eventName, handler, {
        capture: options.capture,
      });
    };
  });
}

// Listen for "lifecyle" events
cleanUpFunctions.push(...listen(window, ['focus', 'blur', 'unload']));

// Listen for "interaction" events
cleanUpFunctions.push(
  ...listen(document, ['scroll', 'click', 'keypress', 'mousemove'], {
    throttle: true,
    capture: true,
  })
);

// Trigger the initial load event
onEvent('load');
