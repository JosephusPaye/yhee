// @ts-check

/**
 * @typedef {Object} Heartbeat
 * @property {string} type    The type of event that triggered the heartbeat
 * @property {number} time    The time of the heartbeat, in ms since the epoch
 * @property {string} origin  The origin of the page at the time of the heartbeat
 * @property {string} path    `location.pathname + location.search` of the page at the time of the heartbeat
 * @property {string} title   `document.title` of the page at the time of the heartbeat
 */

/**
 * @typedef {Object} Duration
 * @property {number} start   The start of the duration, in ms since the epoch
 * @property {number} end     The end of the duration, in ms since the epoch
 * @property {number} length  The length of the duration, in minutes
 */

/**
 * @typedef {Object} ReadableDuration
 * @property {number} hours
 * @property {number} minutes
 * @property {number} seconds
 */

/**
 * @typedef {function(Heartbeat, number=, Heartbeat[]=):boolean} HeartbeatFilterCallback
 */

const enableLogging = true;

/**
 * Log the given values if logging is enabled.
 *
 * @param {*[]}  values  The values to log
 */
export function log(...values) {
  if (enableLogging) {
    console.log('[yhee extension]', ...values);
  }
}

/**
 * Get stored heartbeats data from local storage.
 *
 * @return  {Promise<Heartbeat[]>}
 */
export function getHeartbeats() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get({ heartbeats: [] }, function({ heartbeats }) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      resolve(heartbeats);
    });
  });
}

/**
 * Store the given heartbeat into local storage.
 *
 * @param   {Heartbeat}  heartbeat
 *
 * @return  {Promise<void>}
 */
export async function storeHeartbeat(heartbeat) {
  const heartbeats = await getHeartbeats();

  heartbeats.push(heartbeat);

  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ heartbeats }, function() {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      resolve();
    });
  });
}

/**
 * Get the currently active tab.
 *
 * @return  {Promise<chrome.tabs.Tab>}
 */
export function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      resolve(tabs[0]);
    });
  });
}

/**
 * Check if the extension has been granted permission to read
 * and modify pages on the given origins
 *
 * @param {string[]} origins The origins to check, may include wildcards
 *
 * @return  {Promise<boolean>}
 */
export function hasPermission(...origins) {
  origins = origins.map(origin => {
    return origin.endsWith('/') ? origin + '*' : origin + '/*';
  });

  return new Promise((resolve, reject) => {
    chrome.permissions.contains({ origins }, function(hasPermission) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      resolve(hasPermission);
    });
  });
}

/**
 * Request permission to read and modify pages on the given origins
 *
 * @param {string[]} origins The origins to request permission for, may include wildcards
 *
 * @return  {Promise<boolean>}
 */
export function requestPermission(...origins) {
  origins = origins.map(origin => {
    return origin.endsWith('/') ? origin + '*' : origin + '/*';
  });

  return new Promise((resolve, reject) => {
    chrome.permissions.request({ origins }, function(granted) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      resolve(granted);
    });
  });
}

/**
 * Prompt the user to reload the active tab page to apply content script changes.
 *
 * @param {string} message The prompt message
 */
export function promptForReload(message) {
  chrome.tabs.executeScript({
    // JSON.stringify() escapes the message string to avoid self-XSS
    code: `confirm(${JSON.stringify(message)}) && location.reload()`,
  });
}

/**
 * Remove the extension's permission to read and modify pages on the given origins
 *
 * @param {string[]} origins The origins to remove permission for, may include wildcards
 *
 * @return  {Promise<boolean>}
 */
export function removePermission(...origins) {
  origins = origins.map(origin => {
    return origin.endsWith('/') ? origin + '*' : origin + '/*';
  });

  return new Promise((resolve, reject) => {
    chrome.permissions.remove({ origins }, function(removed) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      resolve(removed);
    });
  });
}

/**
 * Get the extension's current permissions, including origins.
 *
 * @return  {Promise<chrome.permissions.Permissions>}
 */
export function getPermissions() {
  return new Promise((resolve, reject) => {
    chrome.permissions.getAll(function(permissions) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      resolve(permissions);
    });
  });
}

/**
 * Check if the given heartbeat occurred on the current day.
 *
 * @param   {Heartbeat}  heartbeat  The heartbeat
 *
 * @return  {boolean}
 */
export function isToday(heartbeat) {
  const date = new Date(heartbeat.time);
  const today = new Date();
  return (
    date.getDate() == today.getDate() &&
    date.getMonth() == today.getMonth() &&
    date.getFullYear() == today.getFullYear()
  );
}

/**
 * Aggregrate the given array of heartbeats into duration spans.
 *
 * @param {Heartbeat[]} heartbeats          The heartbeats to aggregrate
 * @param {number} timeoutPreference        The filter function to apply before aggregation
 * @param {HeartbeatFilterCallback=} filter The filter function to apply before aggregation
 *
 * @return  {Duration[]}
 */
export function heartbeatsToDurations(heartbeats, timeoutPreference, filter) {
  let relevantHeartbeats = heartbeats;

  if (filter) {
    relevantHeartbeats = heartbeats.filter(filter);
  }

  if (relevantHeartbeats.length === 0) {
    return [];
  }

  if (relevantHeartbeats.length === 1) {
    return [
      {
        start: relevantHeartbeats[0].time,
        end: relevantHeartbeats[0].time,
        length: 0,
      },
    ];
  }

  relevantHeartbeats = relevantHeartbeats.sort((a, b) => a.time - b.time);

  /** @type {Duration[]} */
  const durations = [];

  /** @type {(Heartbeat|undefined)} */
  let lastHeartbeat = undefined;

  for (const heartbeat of relevantHeartbeats) {
    if (
      lastHeartbeat &&
      durations.length > 0 &&
      heartbeat.time - lastHeartbeat.time <= timeoutPreference
    ) {
      durations[durations.length - 1].end = heartbeat.time;
    } else {
      durations.push({ start: heartbeat.time, end: heartbeat.time, length: 0 });
    }

    lastHeartbeat = heartbeat;
  }

  durations.forEach(duration => {
    duration.length = duration.end - duration.start;
  });

  return durations;
}

/**
 * Convert the given duration (in ms) to human-readable hours, minutes, and seconds
 *
 * @param   {number}  duration  The duration, in ms
 *
 * @return  {ReadableDuration}
 */
export function humanReadableDuration(duration) {
  duration = duration / 1000; // Convert the duration to seconds

  const durationInHours = duration / 60 / 60;
  const hours = Math.floor(durationInHours);

  const durationInMinutes = (durationInHours - hours) * 60;
  const minutes = Math.floor(durationInMinutes);

  const durationInSeconds = (durationInMinutes - minutes) * 60;
  const seconds = Math.floor(durationInSeconds);

  return {
    hours,
    minutes,
    seconds,
  };
}
