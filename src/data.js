// @ts-check
import { getStorageData, setStorageData } from './browser';

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

/**
 * @typedef {Object} OriginAggregrate
 * @property {string=} origin
 * @property {number} totalTime
 */

const enableLogging = false;

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
 * @param {HeartbeatFilterCallback=} filter
 * @return {Promise<Heartbeat[]>}
 */
export async function getHeartbeats(filter) {
  const data = await getStorageData({ heartbeats: [] });

  /** @type {Heartbeat[]} */
  const heartbeats = data.heartbeats;

  return filter ? heartbeats.filter(filter) : heartbeats;
}

/**
 * Get the user's timeout preference from local storage.
 *
 * @param {number} conversionFactor The conversion factor, by default converts the timeout from min to ms
 * @return {Promise<number>}
 */
export async function getTimeoutPreference(conversionFactor = 60 * 1000) {
  const timeoutPreference = 15; // TODO: Make configurable, read from local storage
  return timeoutPreference * conversionFactor;
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
  return setStorageData({ heartbeats });
}

/**
 * Check if the given heartbeat occurred on the current day.
 *
 * @param   {Heartbeat}  heartbeat  The heartbeat
 *
 * @return  {boolean}
 */
export function fromToday(heartbeat) {
  const date = new Date(heartbeat.time);
  const today = new Date();
  return (
    date.getDate() == today.getDate() &&
    date.getMonth() == today.getMonth() &&
    date.getFullYear() == today.getFullYear()
  );
}

/**
 * Check if the given heartbeat occurred in the last 7 days.
 *
 * @param   {Heartbeat}  heartbeat  The heartbeat
 *
 * @return  {boolean}
 */
export function fromLastSevenDays(heartbeat) {
  const lastWeekToday = new Date();
  lastWeekToday.setDate(lastWeekToday.getDate() - 7);
  lastWeekToday.setHours(0, 0, 0, 0); // Start of day 00:00

  const today = new Date();
  lastWeekToday.setHours(23, 59, 59, 999); // End of day 23:59

  return (
    heartbeat.time >= lastWeekToday.getTime() &&
    heartbeat.time <= today.getTime()
  );
}

/**
 * Aggregrate the given array of heartbeats into duration spans.
 *
 * @param {Heartbeat[]} heartbeats   The heartbeats to aggregrate
 * @param {number} timeoutPreference The filter function to apply before aggregation
 *
 * @return  {Duration[]}
 */
export function heartbeatsToDurations(heartbeats, timeoutPreference) {
  if (heartbeats.length === 0) {
    return [];
  }

  if (heartbeats.length === 1) {
    return [
      {
        start: heartbeats[0].time,
        end: heartbeats[0].time,
        length: 0,
      },
    ];
  }

  heartbeats = heartbeats.sort((a, b) => a.time - b.time);

  /** @type {Duration[]} */
  const durations = [];

  /** @type {(Heartbeat|undefined)} */
  let lastHeartbeat = undefined;

  for (const heartbeat of heartbeats) {
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

/**
 * Group the given collection by the value of the given property on each item.
 *
 * @param {Array} collection
 * @param {string} property
 */
function groupCollection(collection, property) {
  const groups = {};

  for (const item of collection) {
    groups[item[property]] = groups[item[property]] || [];
    groups[item[property]].push(item);
  }

  return Object.values(groups);
}

/**
 * Get aggregrate data matching the given filter and groupBy parameters.
 *
 * @param {number} timeoutPreference        The timeout preference for heartbeat aggregation
 * @param {HeartbeatFilterCallback} filter  The filter to apply
 * @param {string} groupBy                  The property to group by after filtering
 */
export async function getAggregrate(timeoutPreference, filter, groupBy) {
  const heartbeats = await getHeartbeats(filter);

  /** @type {Heartbeat[][]} */
  const groups = groupCollection(heartbeats, groupBy);

  return groups.map(group => {
    return {
      [groupBy]: group[0][groupBy],
      totalTime: heartbeatsToDurations(group, timeoutPreference).reduce(
        (sum, duration) => sum + duration.length,
        0
      ),
    };
  });
}

/**
 * Get the top domains.
 *
 * @param {number} timeoutPreference        The timeout preference for heartbeat aggregation
 * @param {HeartbeatFilterCallback} filter  The filter to apply
 * @param {number} limit                    The max number of items to retrieve
 * @return {Promise<OriginAggregrate[]>}
 */
export async function getTopDomains(timeoutPreference, filter, limit) {
  return (await getAggregrate(timeoutPreference, filter, 'origin'))
    .sort((a, b) => b.totalTime - a.totalTime)
    .slice(0, limit);
}

export const LIGHT_FILL_COLORS = [
  'rgba(255, 99, 132, 0.2)',
  'rgba(255, 159, 64, 0.2)',
  'rgba(255, 205, 86, 0.2)',
  'rgba(75, 192, 192, 0.2)',
  'rgba(54, 162, 235, 0.2)',
  'rgba(153, 102, 255, 0.2)',
  'rgba(201, 203, 207, 0.2)',
];

export const SOLID_FILL_COLORS = [
  'rgb(255, 99, 132)',
  'rgb(255, 159, 64)',
  'rgb(255, 205, 86)',
  'rgb(75, 192, 192)',
  'rgb(54, 162, 235)',
  'rgb(153, 102, 255)',
  'rgb(201, 203, 207)',
];

/**
 * Convert the given aggregate collection to data or a bar chart.
 *
 * @param {Array} aggregate The aggregrate collection
 * @param {string} chartLabel The chart label
 * @param {(datapoint: any) => string} getLabel The function to get a datapoint's label
 * @param {(datapoint: any) => string} getData The function to get a datapoint's value
 */
export function aggregateToBarChartData(
  aggregate,
  chartLabel,
  getLabel,
  getData,
  styleOptions = {}
) {
  const labels = [];
  const data = [];

  for (const dataPoint of aggregate) {
    labels.push(getLabel(dataPoint));
    data.push(getData(dataPoint));
  }

  return {
    labels,
    datasets: [
      Object.assign(
        {
          label: chartLabel,
          data,
          backgroundColor({ dataIndex: index }) {
            return LIGHT_FILL_COLORS[index % LIGHT_FILL_COLORS.length];
          },
          borderColor({ dataIndex: index }) {
            return SOLID_FILL_COLORS[index % SOLID_FILL_COLORS.length];
          },
          borderWidth: 1,
        },
        styleOptions
      ),
    ],
  };
}
