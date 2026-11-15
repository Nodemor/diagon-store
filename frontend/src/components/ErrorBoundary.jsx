import { Component } from "react";
import { isChunkLoadError, reloadForNewVersion } from "../lib/lazyPage";

/**
 * Last line of defence: if a page crashes, show a way out instead of a blank white screen.
 * Resets when the address changes (App passes the path as `resetKey`).
 */
export class ErrorBoundary extends Component {
  state = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error) {
    // a page file from before the latest update: a fresh copy of the site fixes it
    if (isChunkLoadError(error)) reloadForNewVersion();
    console.error(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="grid min-h-[70vh] place-items-center bg-night px-6 py-20 text-center text-moon">
        <div className="max-w-md">
          <h1 className="text-4xl sm:text-5xl">This street is closed for a moment</h1>
          <p className="mt-4 text-moon-soft">Something didn't load. Reloading the page usually fixes it.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-12 items-center rounded-full bg-lamp px-6 font-semibold text-night hover:bg-lamp-soft"
            >
              Reload the page
            </button>
            <a href="/" className="inline-flex h-12 items-center rounded-full border border-moon/30 px-6 font-semibold hover:border-moon">
              Go to the home page
            </a>
          </div>
        </div>
      </div>
    );
  }
}
