import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../user/entities/user.entity';
import { Repository } from 'typeorm';
import { UserService } from '../../user/user.service';
import { AttrNode } from '../entities/attr.entity';
import { getPremissionNode } from './attr.guards';

@Injectable()
export class AttrsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly userService: UserService) { }

  async grant(id: number, node: object) {
    console.log('grant', id, node);
    if(!node['node']) return;

    const user = await this.userService.findOne(id);
    if (!user) {
      return;
    }
    this.addAttr(user, node['node'].split('.'));
    await this.userRepository.save(user);
  }

  async revoke(id: number, node: object) {
    console.log('revoke', id, node);
    if(!node['node']) return;

    const user = await this.userService.findOne(id);
    if (!user) {
      return;
    }
    this.removeAttr(user, node['node'].split('.'));
    await this.userRepository.save(user);
  }

  async setAttr(user: User, attr: string[], value: boolean) {
    let cur = (await user.attributes).attribute;
    for (const node_idx in attr) {
      const node = attr[node_idx];
      if (!cur[node] && (+node_idx) !== attr.length - 1) {
        cur[node] = {};
        cur = cur[node] as AttrNode;
      } else if (!cur[node] && (+node_idx) === attr.length - 1) {
        cur[node] = value;
      }
    }
  }

  addAttr(user: User, attr: string[]) {
    this.setAttr(user, attr, true);
  }

  removeAttr(user: User, attr: string[]) {
    this.setAttr(user, attr, false);
  }

  async getAttr(user_id: number) {
    return (await (await this.userService.findOne(user_id)).attributes).attribute;
  }

  // test if user has permission on node
  async ownsNode(user_id:number, node:string) {
    if (!node) return true;
    return getPremissionNode((await (await this.userService.findOne(user_id))?.attributes)?.attribute, node.split('.'))
  }
}

