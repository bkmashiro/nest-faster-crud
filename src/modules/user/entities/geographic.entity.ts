import {Entity, Column} from "typeorm";

export class Geographic {
    
    @Column()
    province: string;
    
    @Column()
    city: string;
    
}