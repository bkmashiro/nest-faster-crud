import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import {
  Resource,
  Col,
  Deny,
  Readonly,
  Hidden,
  Searchable,
  Rule,
} from '@faster-crud/core';

@Entity()
@Resource('users', {
  operations: ['create', 'list', 'get', 'update', 'remove'],
  pagination: { max: 50 },
})
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Col({ label: 'Name', list: { sortable: true, filterable: true } })
  @Rule.required()
  @Rule.length(2, 50)
  @Searchable()
  name!: string;

  @Column({ unique: true })
  @Col({ label: 'Email', ui: { widget: 'email' } })
  @Rule.required()
  @Rule.email()
  @Searchable()
  email!: string;

  @Column({ type: 'int', nullable: true })
  @Col({ label: 'Age', ui: { widget: 'number' } })
  @Rule.range(0, 150)
  @Searchable()
  age!: number;

  @Column({ default: 'user' })
  @Col({
    label: 'Role',
    ui: {
      widget: 'select',
      options: { items: ['admin', 'user'] },
    },
  })
  @Deny('create')
  @Searchable()
  role!: string;

  @Column({ type: 'text', nullable: true })
  @Col({ label: 'Bio', ui: { widget: 'textarea' } })
  @Hidden('list')
  bio!: string;

  @CreateDateColumn()
  @Col({ label: 'Created At' })
  @Readonly()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
