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
  const hour = parseInt(rawHour === '24' ? '0' : rawHour, 10);

  if (['Fri', 'Sat', 'Sun', 'Mon'].includes(weekday)) return false;
  if (weekday === 'Thu' && hour >= 17) return false;
  return true;
}
