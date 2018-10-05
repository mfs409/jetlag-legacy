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
    private cancelled = false;

    /** The action to run */
    private action: () => void = () => { };

    /**
     * Create a TimedEvent that can be scheduled to run in the future.
     * 
     * @param interval The time between event executions, in seconds
     * @param repeat   Should this event repeat?
     * @param action   The action to perform when time is up
     */
    constructor(interval: number, repeat: boolean, action: () => void) {
        this.repeat = repeat;
        this.milliInterval = interval * 1000;
        this.action = action;
        this.millisUntilNext = this.milliInterval;
    }

    /** Cancel a TimedEvent, so that it will never run. */
    public cancelEvent() { this.cancelled = true; }

    /**
     * On a clock tick, we check if this event should run, and if so, we run the
     * event.  Note that an event may run more than once, if it loops.
     *
     * @param elapsedMS The milliseconds that have transpired
     * @returns true if this event has not run for the last time yet (either
     *          because it didn't run, or because it did, but it's a repeat
     *          event)
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