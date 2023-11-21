import { Injectable } from "@nestjs/common";
import { PushDataDto } from "src/modules/tracker/dto/push-data.dto";
import { GeoUpdateObject } from "src/modules/tracker/geo.service";

@Injectable()
export class PushHandler { 
  push(pushDataDto: PushDataDto) {
    // if is geo update
    if (true) {
      GeoUpdateObject.next(pushDataDto)
    }
  }
}

