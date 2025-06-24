/**
 * Represents the type of an event.
 */
export type EventType = string;

/**
 * Represents the base class for all events in the system.
 * 
 * @remarks
 * This class provides a common structure for events, including an ID, timestamp, and type.
 * 
 * @public
 */
export class BaseEvent {
  public id: string;
  public timestamp: Date;
  public id: EventType;

  constructor(type: EventType) {
    this.id = type;
    this.id = generateId();
    this.timestamp = new Date();
  }
}

/**
 * Generates a random Id.
 * See "https://stackoverflow.com/a/2117523" for more information
 * @returns Randomize id
 */
function generateId(): string {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
  );
};