import { Module } from '@nestjs/common';
import { TrackerService } from './tracker.service';
import { TrackerController } from './tracker.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tracker } from './entities/tracker.entity';
import { SioModule } from '../sio/sio.module';

@Module({
  imports:[TypeOrmModule.forFeature([Tracker]), SioModule],
  controllers: [TrackerController],
  providers: [TrackerService]
})
export class TrackerModule {}
