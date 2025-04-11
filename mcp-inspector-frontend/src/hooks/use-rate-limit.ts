import { useState, useEffect } from "react";

type RateLimitHook = {
  canMakeRequest: boolean;
  remainingRequests: number;
  resetTime: number;
  incrementRequestCount: () => void;
  resetRequestCount: () => void;
};

/**
 * A hook to manage API rate limiting based on environment variables
 * Uses localStorage to persist request counts across page refreshes
 */
export function useRateLimit(): RateLimitHook {
  // Get rate limit from environment variable or default to 10 per minute
  const rateLimit = parseInt(
    process.env.NEXT_PUBLIC_GEMINI_RATE_LIMIT || "10",
    10
  );

  // Storage keys
  const REQUEST_COUNT_KEY = "gemini_request_count";
  const RESET_TIME_KEY = "gemini_reset_time";

  // Initialize state from localStorage if available
  const [requestCount, setRequestCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;

    const storedCount = localStorage.getItem(REQUEST_COUNT_KEY);
    const storedResetTime = localStorage.getItem(RESET_TIME_KEY);

    // If reset time has passed, reset the count
    if (storedResetTime && Number(storedResetTime) < Date.now()) {
      return 0;
    }

    return storedCount ? parseInt(storedCount, 10) : 0;
  });

  const [resetTime, setResetTime] = useState<number>(() => {
    if (typeof window === "undefined") return Date.now() + 60000;

    const storedResetTime = localStorage.getItem(RESET_TIME_KEY);
    if (storedResetTime && Number(storedResetTime) > Date.now()) {
      return Number(storedResetTime);
    }

    // Default to 1 minute from now
    return Date.now() + 60000;
  });

  // Calculate remaining requests
  const remainingRequests = Math.max(0, rateLimit - requestCount);
  const canMakeRequest = remainingRequests > 0;

  // Set up timer to reset counts
  useEffect(() => {
    // Skip on server-side
    if (typeof window === "undefined") return;

    const timeUntilReset = resetTime - Date.now();

    // If reset time has already passed, establish a new reset time
    if (timeUntilReset <= 0) {
      const newResetTime = Date.now() + 60000; // 1 minute from now
      setResetTime(newResetTime);
      setRequestCount(0);

      localStorage.setItem(RESET_TIME_KEY, newResetTime.toString());
      localStorage.setItem(REQUEST_COUNT_KEY, "0");

      return;
    }

    // Set timer to reset counts when reset time is reached
    const timerId = setTimeout(() => {
      setRequestCount(0);
      setResetTime(Date.now() + 60000);

      localStorage.setItem(RESET_TIME_KEY, (Date.now() + 60000).toString());
      localStorage.setItem(REQUEST_COUNT_KEY, "0");
    }, timeUntilReset);

    return () => clearTimeout(timerId);
  }, [resetTime]);

  // Function to increment the request count
  const incrementRequestCount = () => {
    if (requestCount >= rateLimit) return;

    const newCount = requestCount + 1;
    setRequestCount(newCount);

    if (typeof window !== "undefined") {
      localStorage.setItem(REQUEST_COUNT_KEY, newCount.toString());
    }
  };

  // Function to manually reset the request count
  const resetRequestCount = () => {
    setRequestCount(0);
    setResetTime(Date.now() + 60000);

    if (typeof window !== "undefined") {
      localStorage.setItem(REQUEST_COUNT_KEY, "0");
      localStorage.setItem(RESET_TIME_KEY, (Date.now() + 60000).toString());
    }
  };

  return {
    canMakeRequest,
    remainingRequests,
    resetTime,
    incrementRequestCount,
    resetRequestCount,
  };
}
