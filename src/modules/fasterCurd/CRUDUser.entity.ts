import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { Create, CRUD, Field, FieldFC, Read } from './decorators'
import { $, FC } from './fastcrud-gen/fastcrud.decorator'

@Entity()
@Create({
  requires: ['name', 'type'],
  expect: (x) => x.name.length > 3,
  transformQueryReturn: (x) => {
    return {
      ...x,
      name: x.name.toUpperCase(),
    }
  },
})
@CRUD()
export class CRUDUser {
  @PrimaryGeneratedColumn()
  @$.Number('搬砖速度', { column: { width: 50 }, form: { show: false } })
  id: number

  @Column()
  @$.Text('遥遥领先', { search: { show: true }, column: { resizable: true, width: 200 } })
  name: string

  @Column()
  @$.NumberDictSelect(['随意', '定制'], 'FasterCRUD震撼')
  type: number
}
