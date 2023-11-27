# Nest Faster CRUD template
Decorator based, AOP, easy CRUD template for NestJS

Generate CRUD end points automatically with an entity.

This is an experimental & WIP project.

## Examples
We created a simple CRUDUser class, and generated CRUD end points for it.
see [demo](https://github.com/bkmashiro/nest-faster-crud/blob/main/src/modules/faster-curd/demo/CRUDUser.entity.ts)
```ts
@Create({
  // required fiedls, array and regex are supported
  requires: /.*/,
  // will check name.length > 3
  expect: (x) => x.name.length > 3, 
}) 
@Read({ 
  // when returing, sort id ascending
  sort: { id: 'ASC' } 
})
@CRUD({ name: 'crud-user' }) // name this as crud-user
@IgnoreField(['id']) // id field is ignored by FasterCRUD
export class CRUDUser {
  // $.* decorators are from FasterCRUD, by adding them, FasterCRUD can track them in validation, search, etc.
  // The frontend options can be specified in the decorator
  @$.Number('ID', { column: { width: 50 }, form: { show: false } })
  id: number

  @$.Text('Name', {
    search: { show: true },
    column: { resizable: true, width: 200 },
  })
  name: string

  @$.NumberDictSelect(['User', 'Admin'], 'Type')
  type: number
}
```

This generates 5 end points:
- POST /crud-user/create
- POST /crud-user/update
- POST /crud-user/delete
- POST /crud-user/read
- GET /crud-user/docs

Note that, `docs` end point will return the metadata of the generated contents, including 4 end points above, and the entity itself. This can be used as data dictionary for frontend.

## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run dev
```

