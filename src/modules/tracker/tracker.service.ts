import { Injectable } from '@nestjs/common'
import { CreateTrackerDto } from './dto/create-tracker.dto'
import { UpdateTrackerDto } from './dto/update-tracker.dto'
import { DeviceID } from './decl'

@Injectable()
export class TrackerService {
  constructor() {}

  create(createTrackerDto: CreateTrackerDto) {
    return 'This action adds a new tracker'
  }

  findAll() {
    return `This action returns all tracker`
  }

  findOne(id: number) {
    return `This action returns a #${id} tracker`
  }

  update(id: number, updateTrackerDto: UpdateTrackerDto) {
    return `This action updates a #${id} tracker`
  }

  remove(id: number) {
    return `This action removes a #${id} tracker`
  }
}

export function getTrackerRedisName(id: DeviceID) {
  return `tracker_geo:${id}`
}
