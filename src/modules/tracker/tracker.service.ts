import { Injectable } from '@nestjs/common';
import { CreateTrackerDto } from './dto/create-tracker.dto';
import { UpdateTrackerDto } from './dto/update-tracker.dto';
import { Repository } from 'typeorm';
import { Tracker } from './entities/tracker.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '../db/redis/redis.service';
import { DeviceID } from './decl';
import { SioService } from '../sio/sio.service';
import { PushDataDto } from './dto/push-data.dto';
import { GeoUpdateObject } from './geo.service';

@Injectable()
export class TrackerService {
  constructor(

  ) {}

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
}



export function getTrackerRedisName(id: DeviceID) {
  return `tracker_geo:${id}`;
}