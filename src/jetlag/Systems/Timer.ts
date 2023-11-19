/**
 * TimedEvent is an action that needs to happen after some amount of time has
 * passed.
 */
// TODO: add a way to advance/de-advance a timer, instead of adding a "start
// delay"
export class TimedEvent {
  /** The number of milliseconds before we execute this event's action */
  private msUntilNext: number;

  /** Should we repeat this event */
  private repeat: boolean;

  /** The milliseconds between executions of this event */
  private msInterval: number;

  /** Has the event been explicitly cancelled */
  public cancelled = false;

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
    this.msInterval = interval * 1000;
    this.action = action;
    this.msUntilNext = this.msInterval;
  }

  /**
   * On a clock tick, we check if this event should run, and if so, run the
   * event.  Note that an event may run more than once, if it loops.
   *
   * @param elapsedMS The milliseconds that have transpired
   *
   * @returns true if this event has not run for the last time yet (either
   *          because it didn't run, or because it did, but it's a repeat event)
   */
  public advance(elapsedMS: number) {
    if (this.cancelled) return false;
    this.msUntilNext -= elapsedMS;
    if (this.msUntilNext > 0) return true;
    this.action();
    if (!this.repeat) return false;
    this.msUntilNext = this.msInterval;
    return true;
  }
}

/**
 * Timer is an abstract clock object that can execute events at some point in
 * the future.  Critically, a timer only advances when its associated scene
 * wants it to advance.  Thus we can easily pause a timer, and delay execution
 * of all of its events, by simply failing to call advance().  It is also easy
 * to destroy a timer and end the repetition of the events it entails, because
 * we can do so at the granularity of the Timer, not the individual events.
 */
export class TimerSystem {
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
   * @param elapsedMs The number of milliseconds that have transpired since
   *                  the last clock tick.
   */
  public advance(elapsedMs: number) {
    // The events that return true will go into this, so we can do them
    // again
    let next: TimedEvent[] = [];
    for (let event of this.events)
      if (event.advance(elapsedMs)) next.push(event);
    this.events = next;
  }

  /** Events that get processed on the next render, then discarded */
  public readonly oneTimeEvents: (() => void)[] = [];

  /** Events that get processed on every render */
  public readonly repeatEvents: (() => void)[] = [];

  /** Run any pending events that should happen during a render */
  public runEvents() {
    for (let e of this.oneTimeEvents) e();
    this.oneTimeEvents.length = 0;
    for (let e of this.repeatEvents) e();
  }
}
