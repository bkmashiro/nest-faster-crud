import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, Request, Req, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { StrategyOptions, Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from './auth.service';
import { CacheService } from '../db/redis/cache.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class JwtStorage extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
      signOptions: {
        expiresIn: configService.get('JWT_EXPIRES_IN') ?? 86400,
      },
      passReqToCallback: true,
    } as StrategyOptions);
  }

  async validate(@Req() req: Request, user: Partial<User>) {
    const existUser = await this.authService.getUser(user);
    if (!existUser) {
      throw new UnauthorizedException('User not found');
    }
    // if expired, token is not in redis
    const token = await this.cacheService.get('token:', user.id.toString());
    if (!token) {
      throw new UnauthorizedException('Token expired')
    }
    const auth_header = req.headers['authorization']?.split(' ')
    if (!auth_header|| auth_header.length !== 2) {
      throw new UnauthorizedException('illegal token');
    }
    const header_token = auth_header[1];
    if(token !== header_token) {
      throw new UnauthorizedException('illegal token');
    }

    // if token is not expired, update token expire time
    await this.cacheService.set('token:',
      async () => token, this.configService.get('JWT_EXPIRES_IN_SEC') ?? 86400,
      user.id.toString()
    );

    return existUser;
  }

}