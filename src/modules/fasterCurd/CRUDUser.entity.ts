import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CRUD, Field, IgnoreField } from './test';


@CRUD({ name: 'User' })
@Entity()
@IgnoreField(['id'])
export class CRUDUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Field()
  username: string;

  @Column()
  @Field()
  email: string;
}
