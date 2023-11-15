import { Injectable } from '@nestjs/common';
import { CreateTrackerDto } from './dto/create-tracker.dto';
import { UpdateTrackerDto } from './dto/update-tracker.dto';
import { fromEvent, audit, interval, Subject, auditTime, groupBy, mergeMap, combineLatest, timer, map, bufferTime, filter } from 'rxjs';
import { Repository } from 'typeorm';
import { Tracker } from './entities/tracker.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '../db/redis/redis.service';
import { DeviceID } from './decl';
import { SioService } from '../sio/sio.service';
import { PushDataDto } from './dto/push-data.dto';

export const GeoUpdateObject: Subject<any> = new Subject<any>()

@Injectable()
export class TrackerService {
  constructor(
    @InjectRepository(Tracker)
    private readonly trackerRepository: Repository<Tracker>,
    private readonly redisService: RedisService,
    private readonly sioService: SioService,
  ) {
    // audit the location update
    // only pick last request in 5000ms from every sender accordingly
    GeoUpdateObject.pipe(
      groupBy((auditData) => auditData.deviceId),
      mergeMap((grouped) => grouped.pipe(auditTime(5000)))
    ).subscribe((auditData) => {
      this.saveToDb(auditData.id);
    });

    const timerObservable = timer(1000);

    combineLatest([GeoUpdateObject, timerObservable]).pipe(
      map(([data, _]) => data), 
      bufferTime(5000),
      filter((bufferedData) => bufferedData.length > 0) 
    ).subscribe((compressedData) => {
      console.log('Compressed Data:', compressedData);
      this.sioService.broadcastToGroup('geo', 'geo-update', compressedData);
    });
  }

  create(createTrackerDto: CreateTrackerDto) {
    return 'This action adds a new tracker';
  }

  findAll() {
    return `This action returns all tracker`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tracker`;
  }

  update(id: number, updateTrackerDto: UpdateTrackerDto) {
    return `This action updates a #${id} tracker`;
  }

  remove(id: number) {
    return `This action removes a #${id} tracker`;
  }

  getTrackerRedisName(id: DeviceID) {
    return `tracker_geo:${id}`;
  }

  async saveToDb(id: DeviceID) {
    const deviceGeo = JSON.parse(await this.redisService.get(this.getTrackerRedisName(id)))
    //TODO Validate the location
    // save to db
    this.trackerRepository.update(id, { location: deviceGeo });
  }

  /**
   * Update the location of a tracker
   * @param id 
   * @param location 
   */
  updateLocation(id: DeviceID, location: object) {
    this.redisService.set(this.getTrackerRedisName(id), JSON.stringify(location));

    const auditData = {
      deviceId: id,
      location,
      timestamp: new Date(),
    };

    GeoUpdateObject.next(auditData);

    // broadcast to all users in the same group
    // this.sioService.broadcastToGroup('geo', 'geo-update', auditData)
  }

  handlers: SioDataEventHandler[] = []

  registerHandler(handler: SioDataEventHandler) {
    this.handlers.push(handler)
  }

  handleDataPush(evt: PushDataDto) {
    for (const handler of this.handlers) {
      if (handler.match(evt)) {
        const ret = handler.handle(evt)
        if (ret.done) {
          return
        }
      }
    }
  }
}

type SioDataEventResult = {
  done: boolean,
}

type SioDataEventHandler = {
  match: (evt: any) => boolean,
  handle: (evt: any) => SioDataEventResult,
}