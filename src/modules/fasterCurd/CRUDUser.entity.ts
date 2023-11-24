import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Create, CRUD, Field, Read } from './decorators';
import { FC } from './fastcrud-gen/fastcrud.decorator';

@Entity()
@Create({
  requires: ['username'],
  denies: ['id'],
  transform: x => { x.username = x.username.toUpperCase(); return x },
  expect: [(x: CRUDUser) => x.username.length > 3] as ((data: CRUDUser) => boolean)[],
  route: "create-user"
})

@Read({
  // pagination: {
  //   defaultSize: 2,
  //   limit: {
  //     max:5
  //   }
  // },
  rawInput: true,
})

@CRUD({ name: 'user-management' })
export class CRUDUser {
  @PrimaryGeneratedColumn()
  @Field({
    fc: {
      title: "ID",
      type: "number",
      column: { width: 50 },
      form: { show: false }
    }
  })
  id: number;

  @Column()
  @Field({
    fc: {
      title: "姓名",
      type: "text",
      search: { show: true }
    }
  })
  username: string;

  @Column()
  @Field()
  email: string;
}

