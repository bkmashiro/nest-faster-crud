import { Injectable } from '@nestjs/common'
import { Subject } from 'rxjs'
import {
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
import { Repository } from 'typeorm'
import { GeoData, GeoDataScheme } from './entities/push-geo.dto'
import { SioService } from '../sio/sio.service'
import { ROOM_GEO } from '../sio/ROOM_GEO'

export const GeoUpdateObject: Subject<PushDataDto<GeoData>> = new Subject<
  PushDataDto<GeoData>
>()

@Injectable()
export class GeoService {
  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(Tracker)
    private readonly trackerRepository: Repository<Tracker>, // private readonly sioService: SioService
    private readonly sioService: SioService
  ) {
    const timerObservable = timer(1000)

    GeoUpdateObject.pipe(
      groupBy((auditData) => auditData.device),
      mergeMap((grouped) => grouped.pipe(auditTime(5000)))
    ).subscribe((auditData) => {
      this.redisService.set(
        getTrackerRedisName(auditData.device),
        JSON.stringify(auditData)
      )
    })

    // audit the location update
    // only pick last request in 5000ms from every sender accordingly
    GeoUpdateObject.pipe(
      groupBy((auditData) => auditData.device),
      mergeMap((grouped) => grouped.pipe(auditTime(5000)))
    ).subscribe((auditData) => {
      console.log('Audit Data flushed')
      this.flushCacheToDb(auditData.device)
    })

    combineLatest([GeoUpdateObject, timerObservable])
      .pipe(
        map(([data, _]) => data),
        bufferTime(5000),
        filter((bufferedData) => bufferedData.length > 0)
      )
      .subscribe((compressedData) => {
        console.log('#Compressed Data:', compressedData.length)
        this.sioService.broadcastToGroup(ROOM_GEO, 'geo-update', compressedData)
      })
  }

  async flushCacheToDb(id: DeviceID) {
    const deviceGeo = GeoDataScheme.parse(
      JSON.parse(
        await this.redisService.get(getTrackerRedisName(id))
      ) as GeoData
    )
    console.log('flushing cache to db', deviceGeo)

    // save to db
    this.trackerRepository.upsert(
      {
        id: id,
        location: {
          type: 'Point',
          coordinates: [deviceGeo.longitude, deviceGeo.latitude],
        },
      },
      {
        conflictPaths: ['id'],
      }
    )
  }
}
