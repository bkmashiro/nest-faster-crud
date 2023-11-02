import { Injectable } from '@nestjs/common'
import { RedisService } from './redis.service'
import { createHash } from 'crypto'

@Injectable()
export class CacheService {
    constructor(private readonly redisService: RedisService) {}

    static functionHash(fn: object) {
        return createHash('sha1').update(fn.toString()).digest('base64')
    }


    async set<T>(prefix:string = 'cache:', fn: () => PromiseLike<T>, ttl: number, symbol?: string) {
        const s = prefix + (symbol || CacheService.functionHash(fn))
        const data = await fn()
        await this.redisService.do(e => e.setex(s, ttl, JSON.stringify(data)))
        return data
    }

    async get<T>(prefix:string = 'cache:', symbol?: string) {
        const s = prefix + symbol
        const cache = await this.redisService.do(e => e.get(s))
        if (cache === null || cache === undefined) return null
        return JSON.parse(cache) as T
    }


    /**
     * Destroy Cache
     * @param symbol manually assigned redis key
     */
    async destroyCache(prefix:string = 'cache:',symbol: string) {
        const s = prefix + symbol
        return this.redisService.do(e => e.del(s))
    }

    /**
     * Force reset cache data
     * @param fn function that produce data
     * @param ttl ttl in seconds
     * @param symbol manually assigned redis key
     */
    async forceReset(fn: () => PromiseLike<unknown>, ttl: number, symbol?: string) {
        const s = 'cache:' + (symbol || CacheService.functionHash(fn))
        const data = await fn()
        await this.redisService.do(e => e.setex(s, ttl, JSON.stringify(data)))
        return data
    }

    /**
     * Get data from cache. If not exist, re-produce it.
     * @param fn function that produce data
     * @param ttl ttl in seconds
     * @param symbol manually assigned redis key
     * @param forceRefresh
     */
    async getOrSet<T>(fn: () => PromiseLike<T>, ttl: number, symbol?: string, forceRefresh?: boolean): Promise<T> {
        if (forceRefresh) return this.forceReset(fn, ttl, symbol) as Promise<T>
        const s = 'cache:' + (symbol || CacheService.functionHash(fn))
        let cache: string | null | T = (await this.redisService.do(e => e.get(s))) as string | null
        if (cache === null || cache === undefined) {
            cache = await fn()
            await this.redisService.do(e => e.setex(s, ttl, JSON.stringify(cache)))
            // return in advance because cache here is not a string anymore
            return cache
        }
        // cache is string
        return JSON.parse(cache)
    }

    /**
     * Get data from cache. If not exist, re-produce it.
     * Stored as hash in redis
     * @param fn function that produce data,
     * ENSURE that it will produce exact & correct data for ALL keys when
     * hash is not defined
     * @param fnGetOne function that produce data for ONE SPECIFIED key
     * @param keys hash keys
     * @param symbol manually assigned redis key
     * @warning no ttl
     */
    async getHash<T extends { toString: () => string }>(
        fn: () => PromiseLike<T>,
        parase: (s: string) => PromiseLike<T> | T,
        key: string,
        symbol?: string,
        forceRefresh?: boolean,
    ): Promise<T> {
        const s = 'cache:' + symbol
        let cache: null | string | T = forceRefresh
            ? null
            : ((await this.redisService.do(e => e.hget(s, key))) as string)
        if (cache === null || cache === undefined) {
            cache = await fn()
            // @ts-ignore
            await this.redisService.do(e => e.hset(s, key, cache.toString()))
            // return in advance because cache here is not a string anymore
            return cache
        }
        return parase(cache)
    }

    /**
     * Get data from cache. If not exist, re-produce it.
     * Stored as hash in redis
     * @param fnGenAll function that produce data,
     * ENSURE that it will produce exact & correct data for ALL keys when
     * hash is not defined
     * @param fnGetOne function that produce data for ONE SPECIFIED key
     * @param keys hash keys
     * @param symbol manually assigned redis key
     * @warning no ttl
     */
    async getHashes<V extends { toString: () => string }>(
        fnGenAll: () => PromiseLike<{ [key: string]: V }>,
        fnGenOne: ((key: string) => V) | null,
        keys: Array<string>,
        symbol?: string,
        ttl?: number,
        forceRefresh?: boolean,
    ): Promise<{ [key: string]: V | string }> {
        if (keys.length === 0) return {}
        const s = 'cache:' + symbol
        let cache: { [key: string]: V | string } | null = forceRefresh
            ? null
            : await (async () => {
                // @ts-ignore
                  const vals = (await this.redisService.do(e => e.hmget(s, keys))) as string[]
                  return keys.reduce((map, key, index) => {
                      map[key] = vals[index]
                      return map
                  }, {} as { [key: string]: string })
              })()
        if (cache === null || cache === undefined) {
            cache = await fnGenAll()
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            await this.redisService.do(e => e.hmset(s, Object.entries(cache).flat()))
            if (ttl) await this.redisService.do(e => e.expire(s, ttl))
            // @ts-ignore
            const vals = (await this.redisService.do(e => e.hmget(s, keys))) as string[]
            return keys.reduce((map, key, index) => {
                map[key] = vals[index]
                return map
            }, {})
        }
        // cache is string
        const newlyGenerated: string[] = []
        for (const k in keys) {
            // Logger.debug(`${k} = ${cache[k]}`, 'getHashes');
            if (cache[k] === null || cache[k] === undefined) {
                if (fnGenOne) {
                    const g = await fnGenOne(k)
                    cache[k] = g
                    newlyGenerated.push(k, g.toString())
                } else {
                    cache = await fnGenAll()
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    await this.redisService.do(e => e.hmset(s, Object.entries(cache).flat()))
                    if (ttl) await this.redisService.do(e => e.expire(s, ttl))
                    // @ts-ignore
                    const vals = await this.redisService.do(e => e.hmget(s, keys))
                    return keys.reduce((map, key, index) => {
                        map[key] = vals[index]
                        return map
                    }, {})
                }
            }
        }

        if (fnGenOne && newlyGenerated.length !== 0) {
            await this.redisService.do(e => e.hmset(s, newlyGenerated))
            if (ttl) await this.redisService.do(e => e.expire(s, ttl))
        }
        return cache
    }


}