import { Resource, Col, Deny, Readonly, Hidden, Searchable, Rule } from '@faster-crud/core';

@Resource('users', {
  operations: ['create', 'list', 'get', 'update', 'remove'],
  pagination: { max: 50 },
})
export class User {
  id!: number;

  @Col({ label: 'Username', list: { sortable: true, filterable: true } })
  @Rule.required()
  @Rule.length(3, 20)
  @Searchable()
  username!: string;

  @Col({ label: 'Email', ui: { widget: 'email' } })
  @Rule.required()
  @Rule.email()
  email!: string;

  @Col({ label: 'Role', ui: { widget: 'select' } })
  @Deny('create')
  role!: string;

  @Col({ label: 'Password', ui: { widget: 'password' } })
  @Rule.required()
  @Hidden('list', 'get')
  password!: string;

  @Col({ label: 'Created At' })
  @Readonly()
  createdAt!: Date;
}
