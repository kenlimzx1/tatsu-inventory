import { BaseEvent } from "./Events";

/**
 * Represents a listener function that can be subscribed to an event bus.
 */
export type Listener = (e: BaseEvent) => void;

/**
 * The `Observer` class provides a simple event bus implementation, allowing listeners to subscribe to events and be notified when events are published.
 *
 * @remarks
 * This class maintains a list of listeners and provides methods to subscribe and publish events.
 *
 * @example
 * ```typescript
 * const observer = new Observer();
 * const unsubscribe = observer.subscribe((event) => {
 *   console.log(event);
 * });
 * observer.publish(new BaseEvent());
 * unsubscribe();
 * ```
 *
 * @public
 */
export class Observer {
  private listeners: Listener[] = [];

  /**
   * Subscribes a listener to the event bus.
   * 
   * @param listener - The listener function to be added.
   * @returns A function that, when called, will unsubscribe the listener from the event bus.
   */
  subscribe(listener: Listener): () => void {
    this.listeners = [...this.listeners, listener];

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Unsubscribes a listener from the event bus.
   *
   * @param listener - The listener function to be removed.
   */
  unsubscribe(listener: Listener): void {
    const listenersToUnsubscribe = this.listeners.filter((l) => l !== listener);
    for (let i = listenersToUnsubscribe.length - 1; i >= 0; i--) {
      const index: number = this.listeners.indexOf(listenersToUnsubscribe[i]);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    }
  }

  /**
   * Publishes an event to all registered listeners.
   *
   * @param event - The event to be published, which should be an instance of `BaseEvent`.
   */
  publish(event: BaseEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}