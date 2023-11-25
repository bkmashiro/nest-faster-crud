import { Module } from "@nestjs/common";
import { FasterCrudService } from './FasterCrudService';
import { TypeOrmModule } from "@nestjs/typeorm";
import { CRUDUser } from './CRUDUser.entity';
import { CRUDUserService } from "./CRUDUser.service";
import { FCrudJwtMiddleware } from "./middleware/jwt.middleware";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports:[TypeOrmModule.forFeature([CRUDUser]), AuthModule],
  providers:[FasterCrudService, CRUDUserService, FCrudJwtMiddleware]
})
export class FasterCrudModule {}
