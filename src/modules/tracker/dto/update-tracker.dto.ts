import { PartialType } from '@nestjs/swagger';
import { CreateTrackerDto } from './create-tracker.dto';

export class UpdateTrackerDto extends PartialType(CreateTrackerDto) {}
