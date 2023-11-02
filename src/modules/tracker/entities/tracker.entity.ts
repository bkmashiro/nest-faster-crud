import { BaseEntity, Column, Entity, Geometry, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Tracker extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('geometry', { nullable: false, spatialFeatureType: 'Point', srid: 4326 })
  location: Geometry;
}
