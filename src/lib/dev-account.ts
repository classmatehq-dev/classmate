/** Dev-only: switch which fake account AUTH_DEV_BYPASS resolves to. */
export function setDevAccount(id: string) {
  document.cookie = `classmate_dev_clerk_id=${encodeURIComponent(
    id,
  )}; path=/; max-age=${60 * 60 * 24 * 30}`;
}
