import { Module } from "@nestjs/common";
import { FasterCrudService } from './fc.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { CRUDUser } from './demo/CRUDUser.entity';
import { CRUDUserService } from "./demo/CRUDUser.service";
import { FCrudJwtMiddleware } from "./middleware/jwt.middleware";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports:[TypeOrmModule.forFeature([CRUDUser]), AuthModule],
  providers:[FasterCrudService, CRUDUserService, FCrudJwtMiddleware]
})
export class FasterCrudModule {}
