import axios, { AxiosError } from 'axios';

export type ErrorScenario = 'busy' | 'connection' | 'timeout' | 'unexpected';

export interface FriendlyError {
  scenario: ErrorScenario;
  title: string;
  message: string;
  actionLabel: string;
}

const busyError: FriendlyError = {
  scenario: 'busy',
  title: 'AI Engine Busy',
  message: 'Our AI service is currently experiencing high demand. Please try again in 5–10 minutes.',
  actionLabel: 'Try Again',
};

const authError: FriendlyError = {
  scenario: 'unexpected',
  title: 'Authentication Required',
  message: 'Your session is no longer valid. Please sign in again to continue.',
  actionLabel: 'Log In',
};

const connectionError: FriendlyError = {
  scenario: 'connection',
  title: 'Connection Problem',
  message: 'We\'re having trouble reaching our AI service. Please check your internet connection and try again.',
  actionLabel: 'Retry',
};

const timeoutError: FriendlyError = {
  scenario: 'timeout',
  title: 'Analysis Timeout',
  message: 'Your resume is taking longer than expected. Please wait a moment and retry.',
  actionLabel: 'Retry',
};

const unexpectedError: FriendlyError = {
  scenario: 'unexpected',
  title: 'Unexpected Error',
  message: 'Something went wrong while analyzing your resume. Your uploaded resume is safe. Please try again.',
  actionLabel: 'Analyze Again',
};

const isAxiosError = (error: unknown): error is AxiosError => {
  return axios.isAxiosError(error);
};

export const getFriendlyError = (error: unknown): FriendlyError => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const errorText = error.message?.toString().toLowerCase() || '';

    if (!error.response) {
      return connectionError;
    }

    if (status === 401 || status === 403) {
      return authError;
    }

    if (status === 429 || status === 503 || status === 502) {
      return busyError;
    }

    if (status === 408 || status === 504 || errorText.includes('timeout') || error.code === 'ECONNABORTED') {
      return timeoutError;
    }

    if (typeof status === 'number' && status >= 500) {
      return busyError;
    }

    return unexpectedError;
  }

  const text = typeof error === 'string' ? error.toLowerCase() : '';
  if (text.includes('timeout')) {
    return timeoutError;
  }

  return unexpectedError;
};
