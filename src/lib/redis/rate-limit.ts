import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiter using Upstash Redis.
 * Falls back to a no-op limiter when Redis is not configured or connection fails.
 */

let ratelimit: Ratelimit | null = null;
let initFailed = false;

function initRateLimit() {
  if (initFailed || ratelimit) return;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("[RateLimit] Upstash not configured — rate limiting disabled");
    return;
  }

  try {
    const redis = new Redis({ url, token });

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 requests per 60 seconds
      analytics: true,
      prefix: "zensar-voice-bot",
    });
  } catch (err) {
    console.warn("[RateLimit] Failed to init Upstash:", err);
    initFailed = true;
  }
}

export async function checkRateLimit(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  initRateLimit();

  if (!ratelimit) {
    // Fallback: allow all requests
    return { success: true, remaining: 999 };
  }

  try {
    const result = await ratelimit.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
    };
  } catch (err) {
    console.warn("[RateLimit] Redis error, allowing request:", err);
    return { success: true, remaining: 999 };
  }
}
