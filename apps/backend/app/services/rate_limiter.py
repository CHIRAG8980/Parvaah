"""Thread-safe sliding-window rate limiter for brute-force protection."""

import threading
import time
from collections import defaultdict, deque


class SlidingWindowRateLimiter:
    """In-memory rate limiter using sliding timestamp window."""

    def __init__(self, max_requests: int = 5, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._lock = threading.Lock()
        self._requests: dict[str, deque[float]] = defaultdict(deque)

    def is_allowed(self, key: str) -> tuple[bool, int]:
        """Check if request is permitted under rate limit.

        Returns (allowed, retry_after_seconds).
        """
        now = time.time()
        window_start = now - self.window_seconds

        with self._lock:
            queue = self._requests[key]

            # Remove timestamps outside sliding window
            while queue and queue[0] < window_start:
                queue.popleft()

            if len(queue) >= self.max_requests:
                earliest = queue[0]
                retry_after = max(1, int(earliest + self.window_seconds - now))
                return False, retry_after

            queue.append(now)
            return True, 0

    def reset(self, key: str) -> None:
        """Reset rate limit history for a specific key upon successful validation."""
        with self._lock:
            if key in self._requests:
                del self._requests[key]


# Dedicated rate limiter instances
login_rate_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=60)
refresh_rate_limiter = SlidingWindowRateLimiter(max_requests=30, window_seconds=60)
password_rate_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=60)
