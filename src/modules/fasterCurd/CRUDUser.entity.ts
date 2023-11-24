import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Create, CRUD, Field, Read } from './decorators';

@Entity()
@Create({
  requires: ['username'],
  denies: ['id'],
  transform: x => { x.username = x.username.toUpperCase(); return x },
  expect: [(x: CRUDUser) => x.username.length > 3] as ((data: CRUDUser) => boolean)[],
  route: "create-user"
})

@Read({
  transformReturn: () => "666"
})

@CRUD({name: 'user-management'})
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
