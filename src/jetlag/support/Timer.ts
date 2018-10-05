import { TimedEvent } from "./TimedEvent";

/**
 * Timer is an abstract clock object that can execute events at some point in
 * the future.  Critically, a timer only advances when its associated scene
 * wants it to advance.  Thus we can easily pause a timer, and delay execution
 * of all of its events, by simply failing to call advance().  It is also easy
 * to destroy a timer and end the repetition of the events it entails, because
 * we can do so at the granularity of the Timer, not the individual events.
 */
export class Timer {
    /** The set of events that are pending */
    private events: TimedEvent[] = [];

    /**
     * Add an event to be run in the future.
     * 
     * @param event The event to add
     */
    public addEvent(event: TimedEvent) {
        this.events.push(event);
    }

    /**
     * Move time forward, and handle any events whose time is up
     * 
     * @param elapsedMillis The number of milliseconds that have transpired since
     *                      the last clock tick.
     */
    public advance(elapsedMillis: number) {
        // The events that return true will go into this, so we can do them
        // again
        let next: TimedEvent[] = [];
        for (let event of this.events) {
            if (event.advance(elapsedMillis)) {
                next.push(event);
            }
        }
        this.events = next;
    }
}