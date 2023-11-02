import { BeforeInsert, Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Exclude, Expose, Transform } from 'class-transformer';
import { User } from "../../user/entities/user.entity";

export type AttrNode = {
  [key: string]: AttrNode | boolean; 
};


@Entity('attr')
export class Attr {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'json', nullable: true })
  attribute: AttrNode;
}
