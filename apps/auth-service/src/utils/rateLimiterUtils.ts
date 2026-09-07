export const DEFAULT_WINDOW = 60 * 1000; //1 minute
export const DEFAULT_MAX_REQUESTS = 1;
export const routeRateLimits = {
  REGISTER: {
    maxRequests: 3,
    windowMs: 5 * 60 * 1000,
  },
  LOGIN: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },
  FORGOT_PASSWORD: {
    maxRequests: 2,
    windowMs: 15 * 60 * 1000,
  },
  RESEND_VERIFICATION: {
    maxRequests: 2,
    windowMs: 15 * 60 * 1000,
  },
};
