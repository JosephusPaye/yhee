// @ts-check

/**
 * Get one or more keys from local storage.
 *
 * @param {string | Object | string[]} keys
 * @return {Promise<any>}
 */
export function getStorageData(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, function(data) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      resolve(data);
    });
  });
}

/**
 * Store the given heartbeat into local storage.
 *
 * @param {Object} data
 * @return {Promise<void>}
 */
export async function setStorageData(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, function() {
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
 * and modify pages on the given origins.
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
 * Request permission to read and modify pages on the given origins.
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
 * Remove the extension's permission to read and modify pages on the given origins.
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
