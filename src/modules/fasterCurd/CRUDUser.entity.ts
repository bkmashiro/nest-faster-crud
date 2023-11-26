import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { Create, CRUD, IgnoreField, Read } from './decorators'
import { $ } from './fastcrud-gen/fastcrud.decorator'

@Entity()
@Create({
  requires: /.*/,
  expect: (x) => x.name.length > 3,
})
@Read({ sort: { id: 'ASC' } })
@CRUD({ name: 'user' })
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
