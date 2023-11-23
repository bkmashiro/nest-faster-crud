import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CRUD, Field } from './test';

// @IgnoreField(['id'])

@CRUD()
@Entity()
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
