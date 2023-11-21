// TODO: Code Review

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
   * @param entity The entity whose state is changing.  We pass it as an
   *               argument, so that classes who implement IStateObserver don't
   *               need to cache it.
   * @param event  The event that might have caused `entity`'s state to change
   */
  onStateChange(entity: Actor, event: StateEvent): void;
}

/**
 * Anything that manages state and must notify others of state changes has one
 * of these, to allow others to register their desire to observe its state
 * changes.
 */
export class StateManagerComponent {
  /** The current state */
  current = AnimationState.IDLE_RIGHT;

  /** The set of observers of this.current */
  private observers: IStateObserver[] = [];

  /** Allow an observer to request notification */
  registerObserver(so: IStateObserver) {
    this.observers.push(so);
  }

  /** Receive a state-change request and if it is for a new state, pass it to observers */
  changeState(entity: Actor, event: StateEvent) {
    let newState = transitions.get(this.current)!(event);
    if (newState == this.current) return;
    this.current = newState;
    this.observers.forEach((so) => so.onStateChange(entity, event));
  }
}

/**
 * The events that can cause a state to change.  Note that these events can be
 * generated repeatedly (for example, on each time step, a right-moving Entity
 * will re-generate MOVE_R), so IStateObservers will need to be careful in
 * handling events.
 */
export enum StateEvent {
  MOVE_R = 0,           // Moving to the right
  MOVE_L = 1,           // Moving to the left
  MOVE_STOP = 2,        // Not moving
  THROW_START = 3,      // Started throwing something
  THROW_STOP = 4,       // The timeout after throwing has expired
  INVINCIBLE_START = 5, // Started being invincible
  INVINCIBLE_STOP = 6,  // The invincibility ran out
  JUMP_START = 7,       // Start jumping
  JUMP_STOP = 8,        // Land after a jump
  CRAWL_START = 9,      // Start crawling
  CRAWL_STOP = 10,      // Stop crawling
  DISAPPEAR = 11,       // Disappear from the screen
  COUNT = 12,
}

/**
 * There are many different ways to animate an Entity.  This enum lists every
 * possible animation that is currently supported.  For the time being, these
 * are a superset of all states that any Entity might care about.
 *
 * Note that there are a few times where information can get "lost".  For
 * example, if an entity is jumping and crawling, then we lose whichever started
 * first.  If an entity is throwing, we lose any jump or crawl information.  If
 * an entity is invincible, we lose jump/crawl/throw information.  Disappearing
 * is a terminal state, so we forget everything else when we enter it.  We could
 * flesh out additional states into a bitmask, but so far it's not necessary.
 *
 * TODO: several of these states are not in the Config.ts!
 */
export enum AnimationState {
  IDLE_RIGHT,             // Not moving, facing right
  IDLE_LEFT,              // Not moving, facing left
  MOVE_RIGHT,             // Moving to the right
  MOVE_LEFT,              // Moving left
  JUMP_RIGHT,             // Jumping, moving right
  JUMP_LEFT,              // Jumping, moving left
  JUMP_IDLE_RIGHT,        // Jumping, no x-y movement, facing right
  JUMP_IDLE_LEFT,         // Jumping, no x-y movement, facing left
  CRAWL_RIGHT,            // In a crawl position, moving right
  CRAWL_LEFT,             // In a crawl position, moving left
  CRAWL_IDLE_RIGHT,       // In a crawl position, not moving, facing right
  CRAWL_IDLE_LEFT,        // In a crawl position, not moving, facing left
  THROW_RIGHT,            // Throwing, moving right
  THROW_LEFT,             // Throwing, moving left
  THROW_IDLE_RIGHT,       // Throwing, not moving, facing right
  THROW_IDLE_LEFT,        // Throwing, not moving, facing left
  INVINCIBLE_RIGHT,       // Invincible, moving right
  INVINCIBLE_LEFT,        // Invincible, moving left
  INVINCIBLE_IDLE_LEFT,   // Invincible, not moving, facing left
  INVINCIBLE_IDLE_RIGHT,  // Invincible, not moving, facing right
  DISAPPEARING,           // Actively being removed from the scene
  COUNT,
}

/**
 * Given the above states and overview of transitions, we need a table to
 * describe how an event transitions from one state to another.  This map is
 * from states to transition functions.  The transition functions take an event
 * and return a new state.
 */
export const transitions = new Map([
  [AnimationState.IDLE_RIGHT, from_idle_right],
  [AnimationState.IDLE_LEFT, from_idle_left],
  [AnimationState.MOVE_RIGHT, from_move_right],
  [AnimationState.MOVE_LEFT, from_move_left],
  [AnimationState.JUMP_RIGHT, from_jump_right],
  [AnimationState.JUMP_LEFT, from_jump_left],
  [AnimationState.JUMP_IDLE_RIGHT, from_jump_idle_right],
  [AnimationState.JUMP_IDLE_LEFT, from_jump_idle_left],
  [AnimationState.CRAWL_RIGHT, from_crawl_right],
  [AnimationState.CRAWL_LEFT, from_crawl_left],
  [AnimationState.CRAWL_IDLE_RIGHT, from_crawl_idle_right],
  [AnimationState.CRAWL_IDLE_LEFT, from_crawl_idle_left],
  [AnimationState.THROW_RIGHT, from_throw_right],
  [AnimationState.THROW_LEFT, from_throw_left],
  [AnimationState.THROW_IDLE_RIGHT, from_throw_idle_right],
  [AnimationState.THROW_IDLE_LEFT, from_throw_idle_left],
  [AnimationState.INVINCIBLE_RIGHT, from_invincible_right],
  [AnimationState.INVINCIBLE_LEFT, from_invincible_left],
  [AnimationState.INVINCIBLE_IDLE_LEFT, from_invincible_idle_left],
  [AnimationState.INVINCIBLE_IDLE_RIGHT, from_invincible_idle_right],
  [AnimationState.DISAPPEARING, from_disappearing],
]);

/** A transition function for the `transitions` map */
function from_idle_right(event: StateEvent) {
  if (event == StateEvent.MOVE_R) return AnimationState.MOVE_RIGHT;
  if (event == StateEvent.MOVE_L) return AnimationState.MOVE_LEFT;
  if (event == StateEvent.THROW_START) return AnimationState.THROW_IDLE_RIGHT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_IDLE_RIGHT;
  if (event == StateEvent.JUMP_START) return AnimationState.JUMP_IDLE_RIGHT;
  if (event == StateEvent.CRAWL_START) return AnimationState.CRAWL_IDLE_RIGHT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.IDLE_RIGHT;
}

/** A transition function for the `transitions` map */
function from_idle_left(event: StateEvent) {
  if (event == StateEvent.MOVE_R) return AnimationState.MOVE_RIGHT;
  if (event == StateEvent.MOVE_L) return AnimationState.MOVE_LEFT;
  if (event == StateEvent.THROW_START) return AnimationState.THROW_IDLE_LEFT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_IDLE_LEFT;
  if (event == StateEvent.JUMP_START) return AnimationState.JUMP_IDLE_LEFT;
  if (event == StateEvent.CRAWL_START) return AnimationState.CRAWL_IDLE_LEFT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.IDLE_LEFT;
}

/** A transition function for the `transitions` map */
function from_move_right(event: StateEvent) {
  if (event == StateEvent.MOVE_L) return AnimationState.MOVE_LEFT;
  if (event == StateEvent.MOVE_STOP) return AnimationState.IDLE_RIGHT;
  if (event == StateEvent.THROW_START) return AnimationState.THROW_RIGHT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_RIGHT;
  if (event == StateEvent.JUMP_START) return AnimationState.JUMP_RIGHT;
  if (event == StateEvent.CRAWL_START) return AnimationState.CRAWL_RIGHT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.MOVE_RIGHT;
}

/** A transition function for the `transitions` map */
function from_move_left(event: StateEvent) {
  if (event == StateEvent.MOVE_R) return AnimationState.MOVE_RIGHT;
  if (event == StateEvent.MOVE_STOP) return AnimationState.IDLE_LEFT;
  if (event == StateEvent.THROW_START) return AnimationState.THROW_LEFT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_LEFT;
  if (event == StateEvent.JUMP_START) return AnimationState.JUMP_LEFT;
  if (event == StateEvent.CRAWL_START) return AnimationState.CRAWL_LEFT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.MOVE_LEFT;
}

/** A transition function for the `transitions` map */
function from_jump_right(event: StateEvent) {
  if (event == StateEvent.MOVE_L) return AnimationState.JUMP_LEFT;
  if (event == StateEvent.MOVE_STOP) return AnimationState.JUMP_IDLE_RIGHT;
  if (event == StateEvent.THROW_START) return AnimationState.THROW_RIGHT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_RIGHT;
  if (event == StateEvent.JUMP_STOP) return AnimationState.MOVE_RIGHT;
  if (event == StateEvent.CRAWL_START) return AnimationState.CRAWL_RIGHT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.JUMP_RIGHT;
}

/** A transition function for the `transitions` map */
function from_jump_left(event: StateEvent) {
  if (event == StateEvent.MOVE_R) return AnimationState.JUMP_RIGHT;
  if (event == StateEvent.MOVE_STOP) return AnimationState.JUMP_IDLE_LEFT;
  if (event == StateEvent.THROW_START) return AnimationState.THROW_LEFT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_LEFT;
  if (event == StateEvent.JUMP_STOP) return AnimationState.MOVE_LEFT;
  if (event == StateEvent.CRAWL_START) return AnimationState.CRAWL_LEFT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.JUMP_LEFT;
}

/** A transition function for the `transitions` map */
function from_jump_idle_right(event: StateEvent) {
  if (event == StateEvent.MOVE_R) return AnimationState.JUMP_RIGHT;
  if (event == StateEvent.MOVE_L) return AnimationState.JUMP_LEFT;
  if (event == StateEvent.THROW_START) return AnimationState.THROW_IDLE_RIGHT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_IDLE_RIGHT;
  if (event == StateEvent.JUMP_STOP) return AnimationState.IDLE_RIGHT;
  if (event == StateEvent.CRAWL_START) return AnimationState.CRAWL_IDLE_RIGHT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.JUMP_IDLE_RIGHT;
}

/** A transition function for the `transitions` map */
function from_jump_idle_left(event: StateEvent) {
  if (event == StateEvent.MOVE_R) return AnimationState.JUMP_RIGHT;
  if (event == StateEvent.MOVE_L) return AnimationState.JUMP_LEFT;
  if (event == StateEvent.THROW_START) return AnimationState.THROW_IDLE_LEFT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_IDLE_LEFT;
  if (event == StateEvent.JUMP_STOP) return AnimationState.IDLE_LEFT;
  if (event == StateEvent.CRAWL_START) return AnimationState.CRAWL_IDLE_LEFT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.JUMP_IDLE_LEFT;
}

/** A transition function for the `transitions` map */
function from_crawl_right(event: StateEvent) {
  if (event == StateEvent.MOVE_L) return AnimationState.CRAWL_LEFT;
  if (event == StateEvent.MOVE_STOP) return AnimationState.CRAWL_IDLE_RIGHT;
  if (event == StateEvent.THROW_START) return AnimationState.THROW_RIGHT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_RIGHT;
  if (event == StateEvent.JUMP_START) return AnimationState.JUMP_RIGHT;
  if (event == StateEvent.CRAWL_STOP) return AnimationState.MOVE_RIGHT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.CRAWL_RIGHT;
}

/** A transition function for the `transitions` map */
function from_crawl_left(event: StateEvent) {
  if (event == StateEvent.MOVE_R) return AnimationState.CRAWL_RIGHT;
  if (event == StateEvent.MOVE_STOP) return AnimationState.CRAWL_IDLE_LEFT;
  if (event == StateEvent.THROW_START) return AnimationState.THROW_LEFT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_LEFT;
  if (event == StateEvent.JUMP_START) return AnimationState.JUMP_LEFT;
  if (event == StateEvent.CRAWL_STOP) return AnimationState.MOVE_LEFT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.CRAWL_LEFT;
}

/** A transition function for the `transitions` map */
function from_crawl_idle_right(event: StateEvent) {
  if (event == StateEvent.MOVE_R) return AnimationState.CRAWL_RIGHT;
  if (event == StateEvent.MOVE_L) return AnimationState.CRAWL_LEFT;
  if (event == StateEvent.THROW_START) return AnimationState.THROW_IDLE_RIGHT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_IDLE_RIGHT;
  if (event == StateEvent.JUMP_START) return AnimationState.JUMP_IDLE_RIGHT;
  if (event == StateEvent.CRAWL_STOP) return AnimationState.IDLE_RIGHT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.CRAWL_IDLE_RIGHT;
}

/** A transition function for the `transitions` map */
function from_crawl_idle_left(event: StateEvent) {
  if (event == StateEvent.MOVE_R) return AnimationState.CRAWL_RIGHT;
  if (event == StateEvent.MOVE_L) return AnimationState.CRAWL_LEFT;
  if (event == StateEvent.THROW_START) return AnimationState.THROW_IDLE_LEFT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_IDLE_LEFT;
  if (event == StateEvent.JUMP_START) return AnimationState.JUMP_IDLE_LEFT;
  if (event == StateEvent.CRAWL_STOP) return AnimationState.IDLE_LEFT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.CRAWL_IDLE_LEFT;
}

/** A transition function for the `transitions` map */
function from_throw_right(event: StateEvent) {
  if (event == StateEvent.MOVE_L) return AnimationState.THROW_LEFT;
  if (event == StateEvent.MOVE_STOP) return AnimationState.THROW_IDLE_RIGHT;
  if (event == StateEvent.THROW_STOP) return AnimationState.MOVE_RIGHT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_RIGHT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.THROW_RIGHT;
}

/** A transition function for the `transitions` map */
function from_throw_left(event: StateEvent) {
  if (event == StateEvent.MOVE_R) return AnimationState.THROW_RIGHT;
  if (event == StateEvent.MOVE_STOP) return AnimationState.THROW_IDLE_LEFT;
  if (event == StateEvent.THROW_STOP) return AnimationState.MOVE_LEFT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_LEFT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.THROW_LEFT;
}

/** A transition function for the `transitions` map */
function from_throw_idle_right(event: StateEvent) {
  if (event == StateEvent.MOVE_R) return AnimationState.THROW_RIGHT;
  if (event == StateEvent.MOVE_L) return AnimationState.THROW_LEFT;
  if (event == StateEvent.THROW_STOP) return AnimationState.IDLE_RIGHT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_IDLE_RIGHT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.THROW_IDLE_RIGHT;
}

/** A transition function for the `transitions` map */
function from_throw_idle_left(event: StateEvent) {
  if (event == StateEvent.MOVE_R) return AnimationState.THROW_RIGHT;
  if (event == StateEvent.MOVE_L) return AnimationState.THROW_LEFT;
  if (event == StateEvent.THROW_STOP) return AnimationState.IDLE_LEFT;
  if (event == StateEvent.INVINCIBLE_START) return AnimationState.INVINCIBLE_IDLE_LEFT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.THROW_IDLE_LEFT;
}

/** A transition function for the `transitions` map */
function from_invincible_right(event: StateEvent) {
  if (event == StateEvent.MOVE_L) return AnimationState.INVINCIBLE_LEFT;
  if (event == StateEvent.MOVE_STOP) return AnimationState.INVINCIBLE_IDLE_RIGHT;
  if (event == StateEvent.INVINCIBLE_STOP) return AnimationState.MOVE_RIGHT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.INVINCIBLE_RIGHT;
}

/** A transition function for the `transitions` map */
function from_invincible_left(event: StateEvent) {
  if (event == StateEvent.MOVE_R) return AnimationState.INVINCIBLE_RIGHT;
  if (event == StateEvent.MOVE_STOP) return AnimationState.INVINCIBLE_IDLE_LEFT;
  if (event == StateEvent.INVINCIBLE_STOP) return AnimationState.MOVE_LEFT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.INVINCIBLE_LEFT;
}

/** A transition function for the `transitions` map */
function from_invincible_idle_right(event: StateEvent) {
  if (event == StateEvent.MOVE_R) return AnimationState.INVINCIBLE_RIGHT;
  if (event == StateEvent.MOVE_L) return AnimationState.INVINCIBLE_LEFT;
  if (event == StateEvent.INVINCIBLE_STOP) return AnimationState.IDLE_RIGHT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.INVINCIBLE_IDLE_RIGHT;
}

/** A transition function for the `transitions` map */
function from_invincible_idle_left(event: StateEvent) {
  if (event == StateEvent.MOVE_R) return AnimationState.INVINCIBLE_RIGHT;
  if (event == StateEvent.MOVE_L) return AnimationState.INVINCIBLE_LEFT;
  if (event == StateEvent.INVINCIBLE_STOP) return AnimationState.IDLE_LEFT;
  if (event == StateEvent.DISAPPEAR) return AnimationState.DISAPPEARING;
  return AnimationState.INVINCIBLE_IDLE_LEFT;
}

/** A transition function for the `transitions` map */
function from_disappearing(_event: StateEvent) {
  return AnimationState.DISAPPEARING;
}
