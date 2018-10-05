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
     * @param elapsedMS The number of milliseconds that have transpired since
     *                  the last clock tick.
     */
    public advance(elapsedMS: number) {
        // The events that return true will go into this, so we can do them
        // again
        let next: TimedEvent[] = [];
        for (let event of this.events) {
            if (event.advance(elapsedMS)) {
                next.push(event);
            }
        }
        this.events = next;
    }
}

/**
 * TimedEvent is an action that needs to happen after some amount of time has
 * passed.
 */
export class TimedEvent {
    /** The number of milliseconds before we execute this event's action */
    private millisUntilNext: number;

    /** Should we repeat this event */
    private repeat: boolean;

    /** The milliseconds between executions of this event */
    private milliInterval: number;

    /** Has the event been explicitly cancelled */
    private cancelled: boolean = false;

    /** The action to run */
    private action: () => void = () => { };

    /**
     * Create a TimedEvent that can be scheduled to run in the future.
     * 
     * @param interval The time between event executions, in seconds
     * @param repeat Should this event repeat
     * @param action The action to perform when time is up
     */
    constructor(interval: number, repeat: boolean, action: () => void) {
        this.repeat = repeat;
        this.milliInterval = interval * 1000;
        this.action = action;
        this.millisUntilNext = this.milliInterval;
    }

    /**
     * Cancel a TimedEvent, so that it will never run.
     */
    public cancelEvent() {
        this.cancelled = true;
    }

    /**
     * On a clock tick, we check if this event should run, and if it should be
     * removed from the set of events that will happen in the future
     * 
     * @param elapsedMS The milliseconds that have transpired
     */
    public advance(elapsedMS: number) {
        if (this.cancelled)
            return false;
        this.millisUntilNext -= elapsedMS;
        if (this.millisUntilNext > 0)
            return true;
        this.action();
        if (!this.repeat)
            return false;
        this.millisUntilNext = this.milliInterval;
        return true;
    }
}