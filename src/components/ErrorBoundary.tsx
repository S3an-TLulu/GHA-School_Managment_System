import React from 'react';

// Catches render-time crashes anywhere below it so a single bad component can't
// white-screen the whole app. The user gets a friendly recovery screen with a
// reload button instead of a blank page, and their data (in localStorage) is
// untouched. Error boundaries must be class components — there is no hook form.
interface State { error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep a trace in the console for debugging; nothing is sent anywhere.
    console.error('Unexpected error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mb-4">
            <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.48 14.7A1 1 0 002.7 21h18.6a1 1 0 00.86-1.5l-8.48-14.7a1 1 0 00-1.74 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-600 mt-2 text-sm">
            The app hit an unexpected problem on this screen. Your data is safe — nothing was lost.
            Reloading usually fixes it.
          </p>
          {this.state.error?.message && (
            <p className="mt-3 text-xs text-gray-400 break-words font-mono bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              {this.state.error.message}
            </p>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => this.setState({ error: null })}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              Try again
            </button>
            <button onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Reload app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
