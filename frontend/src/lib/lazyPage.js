import { lazy } from "react";

// After an update is deployed, the page files have new names. A tab opened before the update still
// asks for the old names; if those are gone, the page can't load. The cure is a fresh copy of the
// site: reload once (never twice in a row, so a real outage can't cause a reload loop).

const KEY = "ds-reloaded-for-update";

export const isChunkLoadError = (error) =>
  /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|Failed to fetch/i.test(
    String(error?.message || error),
  );

/** Reloads the page for the new version. Returns false if it already did so in the last 30 seconds. */
export function reloadForNewVersion() {
  let last = 0;
  try {
    last = Number(sessionStorage.getItem(KEY)) || 0;
  } catch {
    /* storage blocked: still reload once */
  }
  if (Date.now() - last < 30_000) return false;
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  window.location.reload();
  return true;
}

/** React.lazy for pages: if the page's file is gone after an update, reload instead of failing. */
export function lazyPage(load) {
  return lazy(() =>
    load().catch((error) => {
      if (isChunkLoadError(error) && reloadForNewVersion()) return new Promise(() => {}); // the reload takes over
      throw error;
    }),
  );
}
