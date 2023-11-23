import { Module } from "@nestjs/common";
import { FasterCrudService } from "./fasterCrudApp";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CRUDUser } from './CRUDUser.entity';
import { CRUDUserService } from "./CRUDUser.service";

@Module({
  imports:[TypeOrmModule.forFeature([CRUDUser])],
  providers:[FasterCrudService, CRUDUserService]
})
export class FasterCrudModule {}
