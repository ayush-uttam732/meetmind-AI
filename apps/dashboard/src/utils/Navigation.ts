/**
 * All page links live here. If your router uses different paths
 * (for example "/meeting-history"), change them in this one file.
 */
export const ROUTES = {
  history: "/meetings",
  details: (id: string) => `/meeting-details?id=${encodeURIComponent(id)}`,
} as const;

export function navigateTo(path: string): void {
  window.location.assign(path);
}

export function openMeetingHistory(): void {
  navigateTo(ROUTES.history);
}

export function openMeeting(id: string): void {
  navigateTo(ROUTES.details(id));
}