/** Get the currently active cooperative ID from localStorage. */
export function getActiveCoopId(): string {
  return localStorage.getItem("pakde-active-profile-id") || "kdp-001";
}
