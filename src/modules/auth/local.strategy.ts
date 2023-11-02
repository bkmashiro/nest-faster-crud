import { compareSync } from 'bcryptjs';
import { PassportStrategy } from '@nestjs/passport';
import { IStrategyOptions, Strategy } from 'passport-local';
import { User } from '../user/entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class LocalStorage extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
   
    super({
      usernameField: 'username',
      passwordField: 'password',
    } as IStrategyOptions);
  }

  async validate(username: string, password: string) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username=:username', { username })
      .getOne();

    if (!user) {
      throw new BadRequestException('user not found');
    }

    if (!compareSync(password, user.password)) {
      throw new BadRequestException('invalid password');
    }

    return user;
  }
} 