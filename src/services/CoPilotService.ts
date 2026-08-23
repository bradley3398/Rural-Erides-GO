/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Rural ERides Go - Secure API Routing Middleware
 */

export const getGeminiApiKey = (): string => {
  if (typeof window !== "undefined") {
    // 1. Check user-configured key from settings first
    const userKey = localStorage.getItem("gemini_api_key");
    if (userKey && userKey.trim().length > 0) {
      return userKey.trim();
    }
  }
  // 2. Fallback to Environment Variable
  return import.meta.env.VITE_GEMINI_API_KEY || "";
};

// --- API Gateway Routers ---
export const getYouTubeApiKey = (): string => import.meta.env.VITE_YOUTUBE_API_KEY;
export const getTavilyApiKey  = (): string => import.meta.env.VITE_TAVILY_API_KEY;
export const getBraveApiKey   = (): string => import.meta.env.VITE_BRAVE_API_KEY;
export const getNewsApiKey    = (): string => import.meta.env.VITE_NEWS_API_KEY;
export const getImgbbApiKey   = (): string => import.meta.env.VITE_IMGBB_API_KEY;
export const getSupabaseApiy  = (): string => import.meta.env.VITE_SUPABASE_API_KEY

/**
 * Robust fetch wrapper with exponential backoff & timeout protection
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: { 
    maxRetries?: number; 
    timeoutMs?: number; 
    useCache?: boolean;
    onRetry?: (attempt: number) => void 
  } = {}
): Promise<Response> {
  const { maxRetries = 2, timeoutMs = 20000, onRetry } = config;

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) return response;

      // If key is invalid or rate limited, throw clean error
      if (response.status === 401 || response.status === 403) {
        throw new Error("API Key authorization failed. Check your System Config.");
      }

      attempt++;
      if (attempt <= maxRetries && onRetry) onRetry(attempt);
      
    } catch (err: any) {
      if (attempt >= maxRetries) {
        throw err;
      }
      attempt++;
      if (onRetry) onRetry(attempt);
      await new Promise((res) => setTimeout(res, 1000 * attempt));
    }
  }

  throw new Error("Network request failed after maximum retries.");
}