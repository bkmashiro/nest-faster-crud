import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { Create, CRUD, IgnoreField, Read } from '../fc.decorators'
import { $ } from '../crud-gen/fast-crud.decorator'

@Entity()
@Create({
  requires: /.*/,
  expect: (x) => x.name.length > 3,
})
@Read({ sort: { id: 'ASC' } })
@CRUD({ name: 'crud-user' })
@IgnoreField(['id'])
export class CRUDUser {
  @PrimaryGeneratedColumn()
  @$.Number('ID', { column: { width: 50 }, form: { show: false } })
  id: number

  @Column()
  @$.Text('Name', {
    search: { show: true },
    column: { resizable: true, width: 200 },
  })
  name: string

  @Column()
  @$.NumberDictSelect(['User', 'Admin'], 'Type')
  type: number
}
