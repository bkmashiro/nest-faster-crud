import { BaseEntity, Column, Entity, Geometry, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Tracker extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column('geometry', { nullable: false, spatialFeatureType: 'Point', srid: 4326 })
  location: Geometry;
}
