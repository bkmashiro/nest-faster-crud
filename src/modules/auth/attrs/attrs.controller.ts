import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Permission } from './attr.decorators';
import { AttrsService } from './attrs.service';
import { PermissionGuard, authedGuard } from '../guards/guards.guard';
import { Roles } from '../roles/roles.decorators';

@Controller('attrs')
export class AttrsController {

  constructor(private readonly attrsService : AttrsService) { }

  @Get('root')
  @Permission('root')
  rootNode(){
    return 'ok'
  }

  @Get('mainsub1sub2')
  @Permission('main.sub1.sub2')
  mainSub1Sub2Node(){
    return 'ok2'
  }

  @Get(':id')
  async getAttrOfUser(@Param('id') id: number){
    return await this.attrsService.getAttr(id);
  }

  @Roles('admin')
  @Post(':id/grant')
  async grantAttrToUser(@Param('id') id: number, @Body() node: object){
    return await this.attrsService.grant(id, node);
  }
}
