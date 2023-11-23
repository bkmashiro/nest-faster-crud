import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Create, CRUD, Field, IgnoreField } from './decorators';


@Entity()
@Create({
  requires: ['username', 'email'],
  expect: (data) => data.username.length > 3,
  transform: (data) => {
    data.username = data.username.toUpperCase();
    return data;
  }
})
@IgnoreField(['id'])
@CRUD({ name: 'User', methods: ['create', 'read'] })
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
