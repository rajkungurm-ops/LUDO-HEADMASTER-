/**
 * Rewards System Helper (Refer & Earn, Daily Spin, Daily Collection)
 * Strict rules and persistence across sessions
 */

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTimeUntilMidnight = (): string => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

export const hasSpunToday = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const today = getTodayDateString();
    return localStorage.getItem('lastSpinDate') === today;
  } catch {
    return false;
  }
};

export const hasCollectedToday = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const today = getTodayDateString();
    return localStorage.getItem('lastCollectDate') === today;
  } catch {
    return false;
  }
};
