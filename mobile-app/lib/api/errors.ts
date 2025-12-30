export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseText?: string
  ) {
    super(message);
    this.name = 'APIError';
  }

  get isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  get userMessage(): string {
    if (this.isAuthError) {
      return 'Your session has expired. Please log in again.';
    }
    if (this.statusCode === 404) {
      return 'The requested resource was not found.';
    }
    if (this.statusCode === 500) {
      return 'Server error. Please try again later.';
    }
    if (this.statusCode && this.statusCode >= 400) {
      return this.message || 'Request failed. Please try again.';
    }
    return this.message || 'An error occurred. Please try again.';
  }
}

