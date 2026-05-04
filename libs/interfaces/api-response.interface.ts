export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
