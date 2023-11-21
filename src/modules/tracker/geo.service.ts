import { Injectable } from '@nestjs/common'
import { Subject } from 'rxjs'
import {
  fromEvent,
  audit,
  interval,
  auditTime,
  groupBy,
  mergeMap,
  combineLatest,
  timer,
  map,
  bufferTime,
  filter,
} from 'rxjs'
import { DeviceID } from './decl'
import { RedisService } from '../db/redis/redis.service'
import { Tracker } from './entities/tracker.entity'
import { getTrackerRedisName } from './tracker.service'
import { PushDataDto } from './dto/push-data.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm';

export const GeoUpdateObject: Subject<PushDataDto> = new Subject<PushDataDto>()

@Injectable()
export class GeoService {
  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(Tracker)
    private readonly trackerRepository: Repository<Tracker>,
    // private readonly sioService: SioService
  ) {
    // audit the location update
    // only pick last request in 5000ms from every sender accordingly
    GeoUpdateObject.pipe(
      groupBy((auditData) => auditData.device),
      mergeMap((grouped) => grouped.pipe(auditTime(5000)))
    ).subscribe((auditData) => {
      console.log('Audit Data flushed:', auditData)
      // this.flushCacheToDb(auditData.device)
    })

    const timerObservable = timer(1000)

    combineLatest([GeoUpdateObject, timerObservable])
      .pipe(
        map(([data, _]) => data),
        bufferTime(5000),
        filter((bufferedData) => bufferedData.length > 0)
      ).subscribe((compressedData) => {
        console.log('Compressed Data brocasted:', compressedData)
        // this.sioService.broadcastToGroup('geo', 'geo-update', compressedData)
      })
  }

  async flushCacheToDb(id: DeviceID) {
    const deviceGeo = JSON.parse(
      await this.redisService.get(getTrackerRedisName(id))
    )
    // TODO Validate the location
    // save to db
    this.trackerRepository.update(id, { location: deviceGeo })
  }
}
