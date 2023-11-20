import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TrackerService } from './tracker.service';
import { CreateTrackerDto } from './dto/create-tracker.dto';
import { UpdateTrackerDto } from './dto/update-tracker.dto';
import { PushDataDto } from './dto/push-data.dto';
import { PushHandler } from '../sio/handlers/pushDataHandler';

@Controller('tracker')
export class TrackerController {
  constructor(
    private readonly trackerService: TrackerService,
    private readonly pushHandler: PushHandler
  ) { }

  @Post()
  create(@Body() createTrackerDto: CreateTrackerDto) {
    return this.trackerService.create(createTrackerDto);
  }

  @Get()
  findAll() {
    return this.trackerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trackerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTrackerDto: UpdateTrackerDto) {
    return this.trackerService.update(+id, updateTrackerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.trackerService.remove(+id);
  }

  @Post("push")
  push(@Body() pushDataDto: PushDataDto) {
    this.pushHandler.push(pushDataDto)
  }
}
