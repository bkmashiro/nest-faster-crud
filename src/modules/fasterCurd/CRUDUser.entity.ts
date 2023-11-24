import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { Create, CRUD, Field, Read } from './decorators'
import { FC } from './fastcrud-gen/fastcrud.decorator'

@Entity()
@Create({
  requires: ['username', 'email'],
  expect: (x) => x.username.length > 3,
})
@Read({
  pagination: {
    max: 5,
  },
})
@CRUD()
export class CRUDUser {
  @PrimaryGeneratedColumn()
  @Field({
    fc: {
      title: 'ID',
      type: 'number',
      column: { width: 50 },
      form: { show: false },
    },
  })
  id: number

  @Column()
  @Field({
    fc: {
      title: '姓名',
      type: 'text',
      search: { show: true },
    },
  })
  username: string

  @Column()
  @Field()
  email: string
}
