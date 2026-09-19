import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatScore(score: number | null | undefined, max: number = 30): string {
  if (score === null || score === undefined) return '—';
  return `${score} / ${max}`;
}

export function getApiError(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as {
      response?: {
        data?: {
          detail?: unknown;
          message?: unknown;
        };
        status?: number;
      };
    };

    const data = axiosError.response?.data;
    if (data) {
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      if (Array.isArray(data.detail)) {
        const messages = data.detail
          .map((item) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') {
              const loc = Array.isArray((item as Record<string, unknown>).loc)
                ? ((item as Record<string, unknown>).loc as (string | number)[])
                    .filter((l) => l !== 'body')
                    .join('.')
                : '';
              const msg =
                typeof (item as Record<string, unknown>).msg === 'string'
                  ? ((item as Record<string, unknown>).msg as string)
                  : JSON.stringify(item);
              return loc ? `${loc}: ${msg}` : msg;
            }
            return String(item);
          })
          .filter(Boolean);
        if (messages.length > 0) return messages.join(', ');
      }
      if (data.detail && typeof data.detail === 'object') {
        const msg = (data.detail as Record<string, unknown>).msg || (data.detail as Record<string, unknown>).message;
        if (typeof msg === 'string') return msg;
        return JSON.stringify(data.detail);
      }
      if (typeof data.message === 'string') {
        return data.message;
      }
    }

    if (axiosError.response?.status === 409) return 'Conflict: this action has already been performed.';
    if (axiosError.response?.status === 403) return 'Access denied.';
    if (axiosError.response?.status === 401) return 'Please log in again.';
    if (axiosError.response?.status === 422) return 'Validation error. Please check your inputs.';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}


export function getRoundLabel(round: 1 | 2): string {
  return `Round ${round}`;
}

export function getStatusColor(status: 'complete' | 'partial' | 'pending'): string {
  switch (status) {
    case 'complete': return 'text-emerald-400';
    case 'partial': return 'text-amber-400';
    case 'pending': return 'text-slate-400';
  }
}

export function getStatusBadge(status: 'complete' | 'partial' | 'pending'): string {
  switch (status) {
    case 'complete': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'partial': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'pending': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}
