import { Column, PrimaryGeneratedColumn } from "typeorm";

export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string;
}
