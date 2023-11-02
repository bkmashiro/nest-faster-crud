import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { createPool, Pool } from 'generic-pool'
import IORedis, { Redis } from 'ioredis'
import { randomUUID } from 'crypto'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class RedisService implements OnModuleInit {
  static do: typeof RedisService.prototype.do
  pool: Pool<Redis>
  private readonly logger = new Logger(RedisService.name)

  constructor(
    configService: ConfigService,
  ) {
    this.pool = createPool(
      {
        async create() {
          return new IORedis(
            {
              host: configService.get('REDIS_HOST'),
              port: configService.get('REDIS_PORT'),
              password: configService.get('REDIS_PASSWORD'),
              db: configService.get('REDIS_DB'),
              lazyConnect: true,
            }
          )
        },
        async destroy(client: Redis) {
          client.disconnect()
        },
      },
      { min: 6, max: 16 },
    )
    RedisService.do = this.do.bind(this)
  }

  async onModuleInit() {
    await this.do(e => e.setex(randomUUID(), 10, 1))
    this.logger.log('RedisService is ready')
  }

  async do<T>(fn: (client: Redis) => Promise<T>): Promise<T> {
    const conn = await this.pool.acquire()
    try {
      return await fn(conn)
    } catch (e) {
      this.logger.warn(`QueryFailed: ${e}`)
      throw e
    } finally {
      await this.pool.release(conn)
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.do(e => e.get(key))
  }

  async set(key: string, value: string | number | Buffer): Promise<string> {
    return await this.do(e => e.set(key, value))
  }

  async setex(key: string, seconds: number, value: string | number | Buffer): Promise<string> {
    return await this.do(e => e.setex(key, seconds, value))
  }

  async del(key: string): Promise<number> {
    return await this.do(e => e.del(key))
  }

  async incr(key: string): Promise<number> {
    return await this.do(e => e.incr(key))
  }

  async decr(key: string): Promise<number> {
    return await this.do(e => e.decr(key))
  }

  async expire(key: string, seconds: number): Promise<number> {
    return await this.do(e => e.expire(key, seconds))
  }

  async ttl(key: string): Promise<number> {
    return await this.do(e => e.ttl(key))
  }

  async exists(key: string): Promise<number> {
    return await this.do(e => e.exists(key))
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.do(e => e.keys(pattern))
  }

  /**
   * @deprecated
   * @returns 
   */
  async flushall(): Promise<string> {
    return await this.do(e => e.flushall())
  }

  /**
   * @deprecated
   * @description Delete all the keys of all the existing databases, not just the currently selected one. This command never fails.
   * @see https://redis.io/commands/flushall
   * @returns 
   */
  async flushdb(): Promise<string> {
    return await this.do(e => e.flushdb())
  }

  async hgetall(key: string): Promise<{ [key: string]: string }> {
    return await this.do(e => e.hgetall(key))
  }
}