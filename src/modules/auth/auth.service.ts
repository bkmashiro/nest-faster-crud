import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { CacheService } from '../db/redis/cache.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService
  ) { }

  async logout(user: any) {
    // console.log('logout');
    await this.cacheService.destroyCache('token:', user.id);
    return {
      success: true,
      data: {
        isLogin: false,
      },
      code: '200',
      message: '已登出',
    };
  }

  async getUser(user: Partial<User>) {
    return await this.usersRepository.findOneOrFail({ where: { id: user.id } });
  }

  createToken(user: Partial<User>) {
    return this.jwtService.sign(user);
  }

  async login(user: Partial<User>) {
    const token = this.createToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    // save token to redis
    await this.cacheService.set('token:',
      async () => token, this.configService.get('JWT_EXPIRES_IN_SEC') ?? 86400,
      user.id.toString()
    );

    return token;
  }

  async verifyToken(token: string) {
    return this.jwtService.verifyAsync(token);
  }

  async getUserByToken(token: string) {
    const payload = await this.verifyToken(token);
    const user = await this.getUser(payload);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
