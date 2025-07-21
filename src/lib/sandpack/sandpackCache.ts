/**
 * Sandpack Cache Utility
 *
 * This utility provides caching for Sandpack dependencies to prevent
 * repeated fetching and rebuilding of the same dependencies.
 */

// Cache version to invalidate when needed
const CACHE_VERSION = '1.0.0';
const CACHE_KEY_PREFIX = 'sandpack-cache-';

interface DependencyCache {
  version: string;
  timestamp: number;
  dependencies: Record<string, string>; // name -> version mapping
  data: unknown; // The actual cached bundle data
}

/**
 * Get a unique cache key based on dependencies
 */
export const getDependencyCacheKey = (deps: Record<string, string>): string => {
  // Sort dependencies by name to ensure consistent keys
  const sortedDeps = Object.entries(deps).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const depsString = sortedDeps
    .map(([name, version]) => `${name}@${version}`)
    .join(',');
  return `${CACHE_KEY_PREFIX}${depsString}`;
};

/**
 * Save dependency bundle to cache
 */
export const cacheDependencyBundle = (
  dependencies: Record<string, string>,
  bundleData: unknown
): void => {
  try {
    console.log('Caching Sandpack dependencies:', dependencies);

    const cacheKey = getDependencyCacheKey(dependencies);
    const cacheData: DependencyCache = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      dependencies,
      data: bundleData,
    };

    // Store in localStorage
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log('Sandpack dependencies cached successfully');
  } catch (error) {
    console.error('Failed to cache Sandpack dependencies:', error);
  }
};

/**
 * Get cached dependency bundle if available
 */
export const getCachedDependencyBundle = (
  dependencies: Record<string, string>
): unknown | null => {
  try {
    const cacheKey = getDependencyCacheKey(dependencies);
    const cachedData = localStorage.getItem(cacheKey);

    if (!cachedData) {
      console.log('No cached dependencies found');
      return null;
    }

    const cache: DependencyCache = JSON.parse(cachedData);

    // Validate cache version
    if (cache.version !== CACHE_VERSION) {
      console.log('Cache version mismatch, ignoring cached dependencies');
      localStorage.removeItem(cacheKey);
      return null;
    }

    // Check if cache is older than 24 hours (86400000 ms)
    const cacheAge = Date.now() - cache.timestamp;
    if (cacheAge > 86400000) {
      console.log('Cache is older than 24 hours, ignoring');
      localStorage.removeItem(cacheKey);
      return null;
    }

    console.log(
      'Using cached Sandpack dependencies from',
      new Date(cache.timestamp).toLocaleString()
    );
    return cache.data;
  } catch (error) {
    console.error('Error reading cached dependencies:', error);
    return null;
  }
};

/**
 * Clear all Sandpack dependency caches
 */
export const clearDependencyCache = (): void => {
  try {
    console.log('Clearing all Sandpack dependency caches');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('Sandpack dependency cache cleared');
  } catch (error) {
    console.error('Error clearing dependency cache:', error);
  }
};

/**
 * Register a Sandpack cache cleanup listener to detect when
 * dependencies have been loaded and built
 */
export const registerSandpackCacheListener = (
  deps: Record<string, string>
): void => {
  try {
    // Listen for custom event from Sandpack iframe
    window.addEventListener('message', (event) => {
      try {
        const data = event.data;

        // Check if the message is from Sandpack
        if (
          data &&
          data.type === 'sandpack:bundler' &&
          data.event === 'success'
        ) {
          console.log('Sandpack bundle completed:', data);

          // Try to extract bundle data
          if (data.compiledModules) {
            cacheDependencyBundle(deps, {
              compiledModules: data.compiledModules,
              bundlerState: data.bundlerState || null,
              timestamp: Date.now(),
            });
          }
        }
      } catch (innerError) {
        console.error('Error processing Sandpack message:', innerError);
      }
    });

    console.log('Registered Sandpack cache listener');
  } catch (error) {
    console.error('Failed to register Sandpack cache listener:', error);
  }
};
