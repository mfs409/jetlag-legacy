import { Actor } from "../Entities/Actor";

/**
 * Anything that wants to subscribe to state changes on an Entity must
 * implement this interface.
 */
export interface IStateObserver {
  /**
   * A notification method, for learning of an event that might change an
   * Entity's state
   *
   * @param actor     The actor whose state is changing.
   * @param event     The event that might have caused `actor`'s state to change
   * @param newState  The new state of `actor`
   * @param oldState  The old state of `actor`
   */
  onStateChange(actor: Actor, event: StateEvent, newState: ActorState, old: ActorState): void;
}

/** The directions an actor can face */
export const enum DIRECTION { N, NE, E, SE, S, SW, W, NW };

/**
 * The subscribable state of an Actor.  Consists of direction and flags related
 * to moving, tossing, invincibility, jumping, and crawling
 */
export class ActorState {
  /** What direction is the actor facing */
  public direction = DIRECTION.E;
  /** Is the actor moving or idle */
  public moving = false;
  /** Is the actor tossing a projectile */
  public tossing = false;
  /** Is the actor invincible */
  public invincible = false;
  /** Is the actor jumping */
  public jumping = false;
  /** Is the actor crawling */
  public crawling = false;
  /** Is the actor disappearing */
  public disappearing = false;
  /** Special tracking for last E/W direction */
  public last_ew = DIRECTION.E;

  /** Make a copy of this ActorState */
  public clone() {
    let a = new ActorState();
    a.direction = this.direction;
    a.moving = this.moving;
    a.tossing = this.tossing;
    a.invincible = this.invincible;
    a.jumping = this.jumping;
    a.crawling = this.crawling;
    a.disappearing = this.disappearing;
    a.last_ew = this.last_ew;
    return a;
  }
}

/**
 * The events that can cause a state to change.  Note that these events can be
 * generated repeatedly (for example, on each time step, a right-moving Entity
 * will re-generate MOVE_R), and multiple can be generated in a single instant
 * (e.g., MOVE_R and MOVE_U), so IStateObservers will need to be careful in
 * handling events.
 */
export const enum StateEvent {
  // Indicate movement (or lack) in each major direction
  MOVE_N, MOVE_NE, MOVE_E, MOVE_SE, MOVE_S, MOVE_SW, MOVE_W, MOVE_NW, STOP,
  // Indicate toss/invincible/jump/crawl happening
  TOSS_Y, TOSS_N, INV_Y, INV_N, JUMP_Y, JUMP_N, CRAWL_Y, CRAWL_N,
  // Indicate being removed
  DISAPPEAR,
}

/**
 * Anything that manages state and must notify others of state changes has one
 * of these, to allow others to register their desire to observe its state
 * changes.
 */
export class StateManagerComponent {
  /** The current state */
  current = new ActorState();

  /** The set of observers of this.current */
  private observers: IStateObserver[] = [];

  /** Allow an observer to request notification */
  registerObserver(so: IStateObserver) {
    this.observers.push(so);
  }

  /** Receive a state-change request and if it is for a new state, pass it to observers */
  changeState(actor: Actor, event: StateEvent) {
    let changed = false;
    let old = this.current.clone();
    switch (event) {
      // Movement events change direction, and un-set idle
      case StateEvent.MOVE_N: changed = this.current.direction != DIRECTION.N || !this.current.moving; this.current.direction = DIRECTION.N; this.current.moving = true; break;
      case StateEvent.MOVE_NE: changed = this.current.direction != DIRECTION.NE || !this.current.moving; this.current.direction = DIRECTION.NE; this.current.moving = true; break;
      case StateEvent.MOVE_E: changed = this.current.direction != DIRECTION.E || !this.current.moving; this.current.direction = DIRECTION.E; this.current.moving = true; break;
      case StateEvent.MOVE_SE: changed = this.current.direction != DIRECTION.SE || !this.current.moving; this.current.direction = DIRECTION.SE; this.current.moving = true; break;
      case StateEvent.MOVE_S: changed = this.current.direction != DIRECTION.S || !this.current.moving; this.current.direction = DIRECTION.S; this.current.moving = true; break;
      case StateEvent.MOVE_SW: changed = this.current.direction != DIRECTION.SW || !this.current.moving; this.current.direction = DIRECTION.SW; this.current.moving = true; break;
      case StateEvent.MOVE_W: changed = this.current.direction != DIRECTION.W || !this.current.moving; this.current.direction = DIRECTION.W; this.current.moving = true; break;
      case StateEvent.MOVE_NW: changed = this.current.direction != DIRECTION.NW || !this.current.moving; this.current.direction = DIRECTION.NW; this.current.moving = true; break;
      // Stop events just set idle
      case StateEvent.STOP: changed = this.current.moving; this.current.moving = false; break;
      // Toss/Invincible/Jump/Crawl events just set/clear their corresponding boolean
      case StateEvent.TOSS_Y: changed = !this.current.tossing; this.current.tossing = true; break;
      case StateEvent.TOSS_N: changed = this.current.tossing; this.current.tossing = false; break;
      case StateEvent.INV_Y: changed = !this.current.invincible; this.current.invincible = true; break;
      case StateEvent.INV_N: changed = this.current.invincible; this.current.invincible = false; break;
      case StateEvent.JUMP_Y: changed = !this.current.jumping; this.current.jumping = true; break;
      case StateEvent.JUMP_N: changed = this.current.jumping; this.current.jumping = false; break;
      case StateEvent.CRAWL_Y: changed = !this.current.crawling; this.current.crawling = true; break;
      case StateEvent.CRAWL_N: changed = this.current.crawling; this.current.crawling = false; break;
      // Disappear is a terminal state
      case StateEvent.DISAPPEAR: changed = !this.current.disappearing; this.current.disappearing = true; break;
    }
    if (changed) {
      this.observers.forEach((so) => so.onStateChange(actor, event, this.current, old));
    }
  }
}