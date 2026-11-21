// Format parts explicitly so Node and browser ICU punctuation cannot differ
// during React hydration. All operational dates use Morocco's timezone.
export function formatMoroccoDate(value) {
  if (!value) return 'Not yet';
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone:'Africa/Casablanca', calendar:'gregory', numberingSystem:'latn',
    year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'
  }).formatToParts(new Date(value)).map(part=>[part.type,part.value]));
  return `${parts.day}/${parts.month}/${parts.year} · ${parts.hour}:${parts.minute}`;
}
