// Returns true if the Friday order window is currently open.
// Open window: Tuesday 00:00 – Thursday 17:00 CET/CEST (Europe/Stockholm).
// Handles daylight saving time automatically via the IANA timezone.
export function isFridayOrderingOpen(): boolean {
  const now = new Date();

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Stockholm',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const rawHour = parts.find((p) => p.type === 'hour')?.value ?? '0';
  // Some environments return "24" for midnight with hour12:false; normalise it.
  const hour = parseInt(rawHour === '24' ? '0' : rawHour, 10);

  // Closed: Fri (already served), Sat, Sun, Mon (menu not posted yet)
  if (['Fri', 'Sat', 'Sun', 'Mon'].includes(weekday)) return false;

  // Closed: Thursday at or after 17:00 CET/CEST
  if (weekday === 'Thu' && hour >= 17) return false;

  // Open: Tue, Wed, or Thu before 17:00
  return true;
}

// Returns a human-readable Stockholm timestamp for debugging / display.
export function getStockholmTimeInfo(): { weekday: string; hour: number; isOpen: boolean } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Stockholm',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const rawHour = parts.find((p) => p.type === 'hour')?.value ?? '0';
  const hour = parseInt(rawHour === '24' ? '0' : rawHour, 10);

  return { weekday, hour, isOpen: isFridayOrderingOpen() };
}
