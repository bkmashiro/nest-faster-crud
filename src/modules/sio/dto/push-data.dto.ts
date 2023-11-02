import { DeviceID } from "src/modules/tracker/decl";
import { GatewayID } from "../decl";

export enum DataFlag {
  NORMAL = 1<<0,
  FORWARD = 1<<1,
  ACK = 1<<2, //May not needed in sio connections
  // ...
}

export class PushDataDto {
  /**
   * The sender of this message, may not be the device 
   * 
   * that sends the data, but the gateway that forwards the message
   */
  sender: GatewayID

  /**
   * The device that sends the data
   */
  device: DeviceID

  /**
   * The content of the data
   */
  content: object;

  /**
   * The timestamp of the data
   */
  timestamp: number;

  /**
   * The type of the data
   */
  flag: number
}