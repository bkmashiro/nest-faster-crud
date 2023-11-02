export type DeviceID = string;

interface ITrackerData { }

enum TrackerStatus {
  Online,
  Offline,
  Unknown
}

interface ITracker {
  id: string;
  name: string;
  description: string;
  status: TrackerStatus;
  dataProvider: ITrackerDataProvider;
  onDataUpdated(cb: (data: ITrackerData) => void): void;
  onOnline(cb: () => void): void;
  onOffline(cb: () => void): void;
}

enum TrackerDataProviderType {
  Passive,
  Active,
  Hub
}

interface ITrackerDataProvider {
  id: string;
  name: string;
  description: string;
  type: TrackerDataProviderType;
}

/**
 * @description
 * PassiveTrackerDataProvider is a data provider that only provides data when it is called.
 */
interface PassiveTrackerDataProvider extends ITrackerDataProvider {
  get(): any;
}

/**
 * @description
 * ActiveTrackerDataProvider is a data provider that provides data actively.
 */
interface ActiveTrackerDataProvider extends ITrackerDataProvider {
  start(): void;
  stop(): void;
}

/**
 * @description
 * TrackerHubProvider is a data provider that provides data from a hub.
 * A hub is a device that connects to multiple trackers and provides data from them.
 * This one is always active.
 * 
 * The client runs this programs too.
 * 
 */
interface TrackerHubProvider extends ITrackerDataProvider {
  getTrackerIds(): string[];
  getTracker(id: string): ITracker;

  onTrackerAdded(cb: (tracker: ITracker) => void): void
  onTrackerRemoved(cb: (tracker: ITracker) => void): void;
  onTrackerEvent(event: string, cb: (tracker: ITracker) => void): void;

  removeTracker(id: string): void;
  addTracker(id: string): void;
  hasTracker(id: string): boolean;

  /**
   * Note that if target is a hub, this will broadcast to all trackers in the hub.
   * @param id 
   * @param message 
   */
  sendMessage(id: string, message: any): void;
}