import { InjectRepository } from '@nestjs/typeorm'
import { CRUDUser } from './CRUDUser.entity'
import { TypeORMRepoAdapter } from './fasterCrudApp'
import { FasterCrudService } from './fasterCRUD'
import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'

@Injectable()
export class CRUDUserService {
  constructor(
    fasterCrudService: FasterCrudService,
    @InjectRepository(CRUDUser)
    userRepo: Repository<CRUDUser>,
  ) {
    fasterCrudService.generateCRUD(CRUDUser, new TypeORMRepoAdapter(userRepo))
  }
}
