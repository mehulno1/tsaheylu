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
    // Only 401 is an authentication error (invalid/missing token)
    // 403 is an authorization error (valid token but insufficient permissions)
    return this.statusCode === 401;
  }

  get userMessage(): string {
    // 401 = Authentication failure: session expired, need to re-login
    if (this.statusCode === 401) {
      return 'Your session has expired. Please log in again.';
    }
    // 403 = Authorization failure: show the actual error message from server
    if (this.statusCode === 403) {
      return this.message || 'You do not have permission to perform this action.';
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

