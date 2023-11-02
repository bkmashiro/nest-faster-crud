import { Injectable } from '@nestjs/common';
import { CreateTrackerDto } from './dto/create-tracker.dto';
import { UpdateTrackerDto } from './dto/update-tracker.dto';
import { fromEvent, audit, interval, Subject, auditTime } from 'rxjs';
import { Repository } from 'typeorm';
import { Tracker } from './entities/tracker.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '../db/redis/redis.service';
import { DeviceID } from './decl';

@Injectable()
export class TrackerService {
  constructor(
    @InjectRepository(Tracker)
    private readonly trackerRepository: Repository<Tracker>,
    private readonly redisService: RedisService
  ) {
    this.auditSubject.pipe(auditTime(5000)).subscribe((auditData) => {
      this.saveToDb(auditData.id);
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
    // save to db
    this.trackerRepository.update(id, { location: deviceGeo });
  }
  /**
   * Update the location of a tracker
   * @param id 
   * @param location 
   */

  private auditSubject: Subject<any> = new Subject<any>();

  updateLocation(id: DeviceID, location: object) {
    this.redisService.set(this.getTrackerRedisName(id), JSON.stringify(location));

    const auditData = {
      deviceId: id,
      location,
      timestamp: new Date(),
    };

    this.auditSubject.next(auditData);
  }
}
