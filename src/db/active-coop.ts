/** Get the currently active cooperative ID from localStorage.
 *  Returns "" when unset (no phantom/placeholder coop id). */
export function getActiveCoopId(): string {
  return localStorage.getItem("pakde-active-profile-id") || "";
}
