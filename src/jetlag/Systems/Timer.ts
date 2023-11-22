/**
 * TimedEvent is an action that needs to happen after some amount of time has
 * passed.
 */
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
   * event.  Note that an event may run more than once, if it loops.  However,
   * if this is a looping event, and elapsedMs is greater tha the period of the
   * timer, it will not run multiple times.
   *
   * Warning: This should only be called by Stage.  You probably want to call
   *          `add()` instead.
   *
   * @param elapsedMs The milliseconds that have transpired
   *
   * @returns true if this event has not run for the last time yet (either
   *          because it didn't run, or because it did, but it's a repeat event)
   */
  public advance(elapsedMs: number) {
    if (this.cancelled) return false;
    this.msUntilNext -= elapsedMs;
    if (this.msUntilNext > 0) return true;
    this.action();
    if (!this.repeat) return false;
    this.msUntilNext = this.msInterval;
    return true;
  }

  /**
   * Act as if an additional `elapsedMs` have transpired.
   *
   * Adding a large number (more than the internal `msUntilNext`) will not cause
   * the event to fire twice.  It also will not cause the event to fire
   * immediately... the event will be run on the next iteration of the render
   * loop.
   *
   * @param seconds How many more seconds have transpired.  Can be negative to
   *                delay when the next timer event happens.
   */
  public add(elapsedMs: number) { this.msUntilNext -= (1000 * elapsedMs); }
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
  public addEvent(event: TimedEvent) { this.events.push(event); }

  /**
   * Move time forward, and handle any events whose time is up
   *
   * @param elapsedMs The number of milliseconds that have transpired since
   *                  the last clock tick.
   */
  public advance(elapsedMs: number) {
    // The events that return true will go into this, so we can do them
    // again.  (Using a separate array avoids invalidating the iterator.)
    let next: TimedEvent[] = [];
    for (let event of this.events)
      if (event.advance(elapsedMs)) next.push(event);
    this.events = next;
  }
}
