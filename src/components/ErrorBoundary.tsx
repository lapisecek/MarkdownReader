import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React tree:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyError = () => {
    const errorDetails = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorDetails);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center p-8 bg-[#121212] text-gray-100 font-sans select-none">
          <div className="max-w-lg w-full bg-[#1e1e1e] border border-red-500/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/10">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold">Something went wrong</h1>
                <p className="text-xs text-gray-400">The application encountered an unexpected interface error.</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-xs text-red-300 max-h-40 overflow-y-auto break-all">
              {this.state.error?.message || 'Unknown error occurred'}
            </div>

            <div className="text-xs text-gray-400 leading-relaxed">
              Don't worry — your file contents on disk remain completely safe. You can reload the app or copy the diagnostic details below.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-800">
              <button
                onClick={this.handleCopyError}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
              >
                {this.state.copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                {this.state.copied ? 'Copied Details' : 'Copy Diagnostics'}
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all"
              >
                <RefreshCw size={14} />
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
