import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configGenerator from './config/config';
import { RedisModule } from './modules/db/redis/redis.module';
import { UsermetaModule } from './modules/usermeta/usermeta.module';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { TrackerModule } from './modules/tracker/tracker.module';
import { SioModule } from './modules/sio/sio.module';
import { DeviceModule } from './modules/device/device.module';
import { FasterCrudModule } from './modules/fasterCurd/fasterCrud.module';

@Module({
  imports: [
    configGenerator(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        return {
          type: 'postgres',
          host: config.get('DB_HOST'),
          port: config.get('DB_PORT'),
          database: config.get('DB_DATABASE'),
          username: config.get('DB_USERNAME'),
          password: config.get('DB_PASSWORD'),
          synchronize: config.get('DB_SYNC'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          // autoLoadEntities: true,
          timezone: '+08:00',
          cache: {
            type: 'redis',
            options: {
              host: config.get('REDIS_HOST'),
              port: config.get('REDIS_PORT'),
              password: config.get('REDIS_PASSWORD'),
              db: config.get('REDIS_DB'),
            },
          },
          // migrationsTableName: "migrations",
          // migrations: ["migrations/*.ts"],
          // cli: {
          //   migrationsDir: "migrations"
          // }
        };
      },
    }),
    UserModule,
    RedisModule,
    UsermetaModule,
    AuthModule,
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    EventEmitterModule.forRoot(),
    MongooseModule.forRoot('mongodb://localhost:27017/'),
    TrackerModule,
    SioModule,
    DeviceModule,
    FasterCrudModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
