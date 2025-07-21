'use client';

import {
  getCachedDependencyBundle,
  cacheDependencyBundle,
} from './sandpackCache';

let isPatched = false;

/**
 * Monkey patches Sandpack's client to add caching capabilities
 * This should be called early in your app's lifecycle
 */
export const monkeyPatchSandpack = (): void => {
  if (isPatched || typeof window === 'undefined') {
    return;
  }

  try {
    console.log('Setting up Sandpack dependency caching...');

    // Create a special cache key in localStorage to track cache status
    localStorage.setItem('sandpack-cache-enabled', 'true');

    // Create a global event listener to capture Sandpack iframe creation
    window.addEventListener('message', (event) => {
      try {
        const data = event.data;

        // Look for Sandpack initialization messages
        if (data && data.type === 'initialized' && data.sandpack) {
          const deps = data.dependencies || {};

          if (Object.keys(deps).length > 0) {
            console.log(
              'Detected Sandpack initialization with dependencies:',
              deps
            );

            // Check if we have a cached version
            const cachedData = getCachedDependencyBundle(deps);
            if (cachedData) {
              console.log('Using cached dependency bundle');

              // Send a custom message to the iframe to use cached data
              if (event.source && typeof window.postMessage === 'function') {
                // TypeScript-safe approach
                if (event.source instanceof Window) {
                  event.source.postMessage(
                    {
                      type: 'use-cached-bundle',
                      bundleData: cachedData,
                    },
                    '*'
                  );
                }
              }
            }
          }
        }

        // Listen for bundle completion to cache
        if (data && data.type === 'bundle-ready' && data.dependencies) {
          const deps = data.dependencies;
          const bundleData = data.bundleData;

          if (deps && bundleData && Object.keys(deps).length > 0) {
            console.log('Caching bundled dependencies:', deps);
            cacheDependencyBundle(deps, bundleData);
          }
        }
      } catch (err) {
        console.error('Error in Sandpack cache listener:', err);
      }
    });

    isPatched = true;
    console.log('Sandpack dependency caching initialized successfully');
  } catch (error) {
    console.error('Failed to patch Sandpack for caching:', error);
  }
};

export const isSandpackCacheEnabled = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return localStorage.getItem('sandpack-cache-enabled') === 'true';
};

export const toggleSandpackCache = (enabled: boolean): void => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem('sandpack-cache-enabled', enabled ? 'true' : 'false');

  if (enabled && !isPatched) {
    monkeyPatchSandpack();
  }
};

export default monkeyPatchSandpack;
