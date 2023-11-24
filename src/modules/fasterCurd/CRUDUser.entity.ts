import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { Create, CRUD, Field, FieldFC, Read } from './decorators'
import { FC } from './fastcrud-gen/fastcrud.decorator'

@Entity()
@Create({
  requires: ['name', 'type'],
  expect: (x) => x.name.length > 3,
})
@Read({
  pagination: {
    max: 5,
  },
})
@CRUD()
export class CRUDUser {
  @PrimaryGeneratedColumn()
  @FC({
    title: 'ID',
    type: 'number',
    column: { width: 50 },
    form: { show: false },
  })
  id: number

  @Column()
  @Field()
  @FC({
    title: '姓名',
    type: 'text',
    search: { show: true },
    column: {
      resizable: true,
      width: 200,
    },
  })
  name: string

  @Column()
  @FC({
    title: "类型",
    type: "dict-select",
    dict: {
      data: [
        { value: 1, label: "开始" },
        { value: 0, label: "停止" }
      ]
    }
  })
  type: number
}
