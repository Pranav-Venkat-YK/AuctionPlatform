import { useState, useEffect } from 'react';
import { userApi } from '../api';

// Shared in-memory cache of userId -> username
const cache = new Map();
const inFlight = new Map();

/**
 * Manually prime the cache with a known user (e.g., currently logged in user).
 */
export function setCachedUser(id, userOrName) {
  if (!id) return;
  const key = String(id);
  const username = typeof userOrName === 'string' ? userOrName : userOrName?.username;
  if (username) {
    cache.set(key, username);
  }
}

/**
 * Fetch a username by user ID with automatic request deduplication and caching.
 */
export async function fetchUsername(userId, token = null) {
  if (!userId) return '';
  const key = String(userId);

  if (cache.has(key)) {
    return cache.get(key);
  }

  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const promise = (async () => {
    try {
      const data = await userApi.getUser(userId, token);
      const name = data?.username || `User #${userId}`;
      cache.set(key, name);
      return name;
    } catch (err) {
      // Return a safe fallback on network/404 error
      return `User #${userId}`;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

/**
 * React hook to resolve a username for a given userId.
 * Returns the resolved username (or empty / fallback while loading).
 */
export function useUsername(userId, token = null) {
  const [username, setUsername] = useState(() => {
    if (!userId) return '';
    const key = String(userId);
    return cache.get(key) || '';
  });

  useEffect(() => {
    if (!userId) {
      setUsername('');
      return;
    }

    const key = String(userId);
    if (cache.has(key)) {
      setUsername(cache.get(key));
      return;
    }

    let isMounted = true;
    fetchUsername(userId, token).then(name => {
      if (isMounted && name) {
        setUsername(name);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [userId, token]);

  return username || (userId ? `User #${userId}` : '');
}

/**
 * React hook to resolve multiple usernames at once (e.g. for bid history list).
 * Returns an object mapping userId -> username.
 */
export function useUsernames(userIds, token = null) {
  const [names, setNames] = useState({});

  useEffect(() => {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      setNames({});
      return;
    }

    let isMounted = true;
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));

    // Immediately pick up any already cached
    const current = {};
    uniqueIds.forEach(id => {
      const key = String(id);
      if (cache.has(key)) {
        current[id] = cache.get(key);
      }
    });
    setNames(prev => ({ ...prev, ...current }));

    // Fetch missing
    const missing = uniqueIds.filter(id => !cache.has(String(id)));
    if (missing.length > 0) {
      Promise.all(
        missing.map(async id => {
          const name = await fetchUsername(id, token);
          return [id, name];
        })
      ).then(entries => {
        if (isMounted) {
          setNames(prev => {
            const next = { ...prev };
            entries.forEach(([id, name]) => {
              next[id] = name;
            });
            return next;
          });
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(userIds), token]);

  return names;
}

