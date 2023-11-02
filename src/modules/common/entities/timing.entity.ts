import { CreateDateColumn, UpdateDateColumn } from "typeorm";

export class TimingEntity {
  @CreateDateColumn()
  created_at: Date;
  @UpdateDateColumn()
  updated_at: Date;
}