// metricsCache.ts

import Redis from 'ioredis'
import { AuroraTraceEngine } from './auroraPatternEngine'

/**
 * Wrapper around AuroraTraceEngine that caches on-chain metrics in Redis
 */
export class MetricsCache {
  private redis: Redis.Redis
  private engine: AuroraTraceEngine
  private ttlSeconds: number

  /**
   * @param redisUrl URL of the Redis server
   * @param apiUrl   Base URL of the AuroraTrace API
   * @param apiKey   API key for AuroraTrace
   * @param ttl      Time-to-live for cached entries, in seconds
   */
  constructor(
    redisUrl: string,
    apiUrl: string,
    apiKey: string,
    ttl: number = 300
  ) {
    this.redis = new Redis(redisUrl)
    this.engine = new AuroraTraceEngine(apiUrl, apiKey)
    this.ttlSeconds = ttl
  }

  /**
   * Generates a unique cache key based on address and period
   */
  private cacheKey(contractAddress: string, periodHours: number): string {
    return `aurora:metrics:${contractAddress}:${periodHours}`
  }

  /**
   * Retrieves metrics from cache or fetches fresh data if missing or stale
   */
  async getMetrics(
    contractAddress: string,
    periodHours: number
  ): Promise<import('./auroraPatternEngine').OnChainMetric[]> {
    const key = this.cacheKey(contractAddress, periodHours)
    const cached = await this.redis.get(key)

    if (cached) {
      try {
        const parsed = JSON.parse(cached) as import('./auroraPatternEngine').OnChainMetric[]
        return parsed
      } catch {
        // if parse fails, fall through to fetch fresh metrics
      }
    }

    const freshMetrics = await this.engine.fetchMetrics(contractAddress, periodHours)
    await this.redis.set(key, JSON.stringify(freshMetrics), 'EX', this.ttlSeconds)
    return freshMetrics
  }

  /**
   * Clears the cache entry for a specific contract and period
   */
  async clearCache(contractAddress: string, periodHours: number): Promise<void> {
    const key = this.cacheKey(contractAddress, periodHours)
    await this.redis.del(key)
  }

  /**
   * Shuts down the Redis connection
   */
  async shutdown(): Promise<void> {
    await this.redis.quit()
  }
}
