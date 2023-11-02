import { Injectable } from '@nestjs/common';
import { RedisService } from '../db/redis/redis.service';
import { UserStatus } from './entities/usermeta.entity';
const STATUS_EXPIRE = 60 * 60 * 2 //2h
//TODO: set this to a lower value in production, and use heartbeat to update the status
@Injectable()
export class UsermetaService {
  prefix = 'usermeta_'
  constructor(
    private readonly redisService: RedisService,
  ) {
    // on init, set all users to offline, delete all usermeta
    this.redisService.keys(this.prefix + '*').then(keys => {
      keys.forEach(key => {
        this.redisService.del(key)
      })
    })
  }

  async online(userId: number) {
    return await this.redisService.setex(this.prefix + userId, STATUS_EXPIRE, UserStatus.ONLINE)
  }

  async offline(userId: number) {
    return await this.redisService.setex(this.prefix + userId, STATUS_EXPIRE, UserStatus.OFFLINE)
  }

  async setStatus(userId: number, status: UserStatus) {
    return await this.redisService.set(this.prefix + userId, status)
  }

  async getStatusCode(userId: number) {
    try {
      const status = await this.redisService.get(this.prefix + userId)
      console.log(status)
      if (!status) {
        return UserStatus.UNKNOWN
      }
      return status
    } catch {
      return UserStatus.UNKNOWN
    }
  }
}
