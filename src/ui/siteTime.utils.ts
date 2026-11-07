/** Shows a site time as minutes and seconds, such as 02:15. */
export function formatSiteTime(seconds: number): string {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");

  return `${minutes}:${remainder}`;
}
