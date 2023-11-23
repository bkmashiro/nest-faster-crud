import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CRUD, Field, IgnoreField } from './test';


@CRUD()
@Entity()
@IgnoreField(['id'])
export class CRUDUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Field()
  public username: string;

  @Column()
  @Field()
  public email: string;
}
