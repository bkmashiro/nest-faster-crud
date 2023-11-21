import { Injectable } from "@nestjs/common";
import { GeoUpdateObject } from "src/modules/tracker/GeoUpdateObject";
import { PushDataDto } from "src/modules/tracker/dto/push-data.dto";

@Injectable()
export class PushHandler { 
  push(pushDataDto: PushDataDto) {
    // if is geo update
    if (true) {
      GeoUpdateObject.next(pushDataDto)
    }
  }
}

