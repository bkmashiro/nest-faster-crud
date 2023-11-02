import { BaseEntity, BeforeInsert, Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import * as bcrypt from 'bcryptjs';
import { Exclude } from 'class-transformer';
import { Attr } from "../../auth/entities/attr.entity";
import { ChatGroup } from "src/modules/chatgroup/entities/chatgroup.entity";
import { Media } from "src/modules/media/entities/media.entity";
import { Chatsess } from "src/modules/chatsess/entities/chatsess.entity";


@Entity('user')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: "varchar", length: 200, nullable: true })
  name: string; // nickname

  @Index({ unique: true })
  @Unique('username', ['username'])
  @Column({ type: "varchar", length: 200 })
  username: string;

  @Exclude()                 // Exclude means this column will not be returned in the response
  @Column({ select: false }) // select: false means this column will not be selected by default
  password: string;          // when querying the database, aka. not returned in the response

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  signature: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  group: string;

  @Column({ type: 'json', nullable: true })
  tags: { key: number, label: string }[];

  @Column({ default: 0 })
  notifyCount: number;

  @Column({ default: 0 })
  unreadCount: number;

  @Column({ nullable: true })
  country: string;

  @Column('simple-enum', { enum: ['admin', 'user', 'visitor'] })
  role: string;

  @OneToOne(() => Attr, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  attributes: Promise<Attr>;

  @Column({ nullable: true })
  address: string;
  @Column({ nullable: true })
  phone: string;
  @Column({ nullable: true })
  status: number;
  @CreateDateColumn()
  created_at: Date;
  @UpdateDateColumn()
  updated_at: Date;
  @DeleteDateColumn()
  deleted_at: Date;

  @ManyToMany(() => ChatGroup, chatgroup => chatgroup.members, { onDelete: 'CASCADE' })
  joinedChatGroups: Promise<ChatGroup[]>;

  @ManyToMany(() => User, user => user.friends, { onDelete: 'CASCADE' })
  @JoinTable()
  friends: Promise<User[]>;

  /**
   * this is the public key of the user, used for e2e encryption
   * if a user want to send a e2e message to an offline user,
   * he should encrypt the message with this public key
   */
  @Column('text', { nullable: true })
  public_key: Promise<string>;

  @OneToMany(() => Media, media => media.createdBy, { onDelete: 'CASCADE' })
  medias: Promise<Media[]>

  @ManyToMany(() => Media, media => media.visibleTo, { onDelete: 'CASCADE' })
  @JoinTable()
  accessTokens: Promise<Media[]>

  @ManyToMany(() => Chatsess, chatsess => chatsess.members, { onDelete: 'CASCADE' })
  chatSessions: Promise<Chatsess[]>

  @BeforeInsert()
  async encryptPwd() {
    this.password = bcrypt.hashSync(this.password);
  }
}
