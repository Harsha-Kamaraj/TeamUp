import { Component } from 'react';

/**
 * ErrorBoundary — catches render/lifecycle errors anywhere below it.
 *
 * Without one, a single throwing component (a missing `user`, an unexpected
 * API shape) unmounts the entire React tree and the user is left staring at a
 * blank white page with no clue what happened. This turns that into a readable
 * message they can recover from.
 *
 * Must be a class: React has no hook equivalent for componentDidCatch.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surfaces in the browser console and the Vite terminal during dev.
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="grid min-h-[70svh] place-items-center px-6">
        <div className="w-full max-w-md text-center">
          <p className="text-5xl">😵‍💫</p>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Something broke</h1>
          <p className="mt-2 text-sm text-slate-500">
            This part of the page hit an unexpected error. Reloading usually fixes it.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-brand-gradient rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Reload the page
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="bg-card rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Go home
            </button>
          </div>

          {import.meta.env.DEV && (
            <pre className="mt-6 max-h-48 overflow-auto rounded-xl bg-card-2 p-3 text-left text-xs text-red-500">
              {error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
