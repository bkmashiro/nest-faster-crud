import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Attr } from 'src/modules/auth/entities/attr.entity';
import { PaginationQueryDto } from '../common/dtos/pagination.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) {}

  
  async register(createUser: CreateUserDto) {
    // console.log('createUser', createUser);
    const { username } = createUser;
    const existUser = await this.usersRepository.findOne({
      where: { username },
    })
    
    if(existUser){
        throw new HttpException("user already exist", HttpStatus.BAD_REQUEST)
    }

    const newUser = this.usersRepository.create(createUser)
    const attr = new Attr()
    attr.attribute = {}
    newUser.attributes = Promise.resolve(attr)

    return await this.usersRepository.save(newUser)
  } 

  async create(createUserDto: CreateUserDto) {

    const user = new User();
    user.username = createUserDto.username;
    user.password = createUserDto.password;
    user.email = createUserDto.email;

    const attr = new Attr();
    attr.attribute = {};
    user.attributes = Promise.resolve(attr);

    return await this.usersRepository.save(user);
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    return await this.usersRepository.find({
      skip: paginationQuery.offset,
      take: paginationQuery.limit,
    });
  }

  findOne(id: number) {
    if (isNaN(id)) throw new HttpException('id must be a number', HttpStatus.BAD_REQUEST);
    return this.usersRepository.findOneOrFail({ 
      where: { id },
    });
  }

  findByUsername(username: string) {
    return this.usersRepository.findOne({ where: { username }});
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    if (isNaN(id)) throw new HttpException('id must be a number', HttpStatus.BAD_REQUEST);
    const userexist = this.usersRepository.findOne({ where: { id }});
    if (userexist) {
      this.usersRepository.update(id, updateUserDto);
    } else {
      throw new HttpException('user not found', HttpStatus.NOT_FOUND);
    }
  }

  remove(id: number) {
    if (isNaN(id)) throw new HttpException('id must be a number', HttpStatus.BAD_REQUEST);
    const userexist = this.usersRepository.findOne({ where: { id }});
    if (userexist) {
      this.usersRepository.delete(id);
    } else {
      throw new HttpException('user not found', HttpStatus.NOT_FOUND);
    }
  }

  async getAllUserBasicInfo() {
    const users = await this.usersRepository.find({
      select: ['id', 'username', 'role'],
    });
    return users;
  }

  async testUser() {
    // add test users
    if (!await this.findByUsername('admin')){
      this.register({
        username: 'admin',
        password: 'admin',
        email: 'admin@yuzhes.com'
      })
      Logger.debug('admin user created')
    }

    if (!await this.findByUsername('user')){
      this.register({
        username: 'user',
        password: 'user',
        email: 'user@yuzhes.com'
      })
      Logger.debug('user user created')
    }

    return 'created'  
  }
}
