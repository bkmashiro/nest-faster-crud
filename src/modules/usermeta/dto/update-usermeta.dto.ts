import { PartialType } from '@nestjs/swagger';
import { CreateUsermetaDto } from './create-usermeta.dto';

export class UpdateUsermetaDto extends PartialType(CreateUsermetaDto) {}
