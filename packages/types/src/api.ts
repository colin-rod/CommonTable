// API request/response types
// Placeholder - will be populated as we build features

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  metadata?: Record<string, unknown>;
}
