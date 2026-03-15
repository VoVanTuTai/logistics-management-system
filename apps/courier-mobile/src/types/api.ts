export interface ApiProblem {
  message: string;
  status: number | null;
  isNetworkError: boolean;
  details?: unknown;
}
