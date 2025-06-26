import { BaseEvent, EventType } from "./Events";
import { Listener, Observer } from "./Observer";

export * from "./Events";

/**
 * Represents a map of event types to observers.
 */
type ObserversMap = Record<EventType, Observer>;

/**
 * The EventBus class is a singleton that manages event publishing and subscription.
 * It allows different parts of the application to communicate with each other
 * by publishing events and subscribing to them.
 * 
 * Reference:  https://github.com/nijatismayilov/typescript-eventbus/blob/main/src/eventbus.ts
 *
 * @class EventBus
 * @example
 * // Define an event type and a listener
 * const eventType = 'some-event';
 * const listener = (event) => { console.log(event); };
 *
 * // Subscribe to an event
 * EventBus.subscribe(eventType, listener);
 *
 * // Publish an event to all subscribers
 * EventBus.publish(eventType, { data: 'example data' });
 */
class EventBus {
  private static instance: EventBus;
  private observers: ObserversMap = {};

  private constructor() { }

  static getInstance() {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }

    return EventBus.instance;
  }

  /**
   * Publishes an event to all observers of the specified event type.
   *
   * @param type - The type of the event to publish.
   * @param event - The event object to be published.
   */
  public publish(type: EventType, event: BaseEvent): void {
    if (!EventBus.getInstance().observers[type]) {
      EventBus.getInstance().observers = {
        ...EventBus.getInstance().observers,
        [type]: new Observer(),
      };
    }

    EventBus.getInstance().observers[type].publish(event);
  }

  /**
   * Subscribes a listener to an event type.
   *
   * @param type - The type of the event to subscribe to.
   * @param listener - The listener function to be added.
   * @returns A function that, when called, will unsubscribe the listener from the event bus.
   */
  public subscribe(
    type: EventType,
    listener: Listener
  ): () => void {
    if (!EventBus.getInstance().observers[type]) {
      EventBus.getInstance().observers = {
        ...EventBus.getInstance().observers,
        [type]: new Observer(),
      };
    }

    return EventBus.getInstance().observers[type].subscribe(listener);
  }

  /**
   * Unsubscribes a listener from an event type.
   *
   * @param type - The type of the event to unsubscribe from.
   * @param listener - The listener function to be removed.
   */
  public unsubscribe(
    type: EventType,
    listener: Listener
  ): void {
    if (EventBus.getInstance().observers[type]) {
      EventBus.getInstance().observers[type].unsubscribe(listener);
    }
  }
}

export default EventBus.getInstance();