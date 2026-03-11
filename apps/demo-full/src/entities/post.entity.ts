import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Resource, Col, Readonly, Searchable, Rule } from '@faster-crud/core';
import { User } from './user.entity';

@Entity()
@Resource('posts', {
  operations: ['create', 'list', 'get', 'update', 'remove'],
  pagination: { max: 50 },
})
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Col({ label: 'Title', list: { sortable: true, filterable: true } })
  @Rule.required()
  @Rule.length(1, 200)
  @Searchable()
  title!: string;

  @Column({ type: 'text', nullable: true })
  @Col({ label: 'Content', ui: { widget: 'textarea' } })
  content!: string;

  @Column({ type: 'int' })
  @Col({ label: 'Author ID', ui: { widget: 'text' } })
  @Rule.required()
  @Searchable()
  authorId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @Column({ default: false })
  @Col({ label: 'Published', ui: { widget: 'switch' } })
  @Searchable()
  published!: boolean;

  @CreateDateColumn()
  @Col({ label: 'Created At' })
  @Readonly()
  createdAt!: Date;
}
