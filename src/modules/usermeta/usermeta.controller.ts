import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsermetaService } from './usermeta.service';
import { Roles } from '../auth/roles/roles.decorators';
import { ROLES } from '../auth/roles/roles.constants';
import { UserStatus } from './entities/usermeta.entity';

@Controller('usermeta')
export class UsermetaController {
  constructor(private readonly usermetaService: UsermetaService) {}
  // @Roles(ROLES.USER)
  @Post('status')
  async getStatus(@Body() body: { userId: number }) {
    const res = await this.usermetaService.getStatusCode(body.userId)
    return {
      status: UserStatus[res],
    }
  }
}
