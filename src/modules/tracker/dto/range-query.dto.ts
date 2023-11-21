import { DeviceID } from "../decl";

export class QueryTrackerPeriodDto {
  id: DeviceID

  begin: Date

  end: Date

  skip: number
  limlt: number
}