import { Global, Module } from '@nestjs/common'
import { RedisService } from './redis.service'
import { CacheService } from './cache.service'
import { ConfigService } from '@nestjs/config'

@Global()
@Module({
    providers: [RedisService, CacheService, ConfigService],
    exports: [RedisService, CacheService],
})
export class RedisModule {}