import { Actor } from "../Entities/Actor";

/**
 * ActorPool stores a bunch of actors.  We can get into lots of trouble with
 * Box2d if we make too many single-use actors, so the ActorPool is a useful
 * mechanism for recycling / reusing projectiles.
 */
export class ActorPool {
  /** A collection of all the available actors */
  private pool = [] as Actor[];

  /** For limiting the number of actors that can be returned */
  private remaining?: number;

  /** Index of next available actor */
  private nextIndex = 0;

  /** Return the number of actors remaining */
  public getRemaining() { return this.remaining ?? 0; }

  /**
   * Set a limit on the total number of actors that are available
   *
   * @param number How many actors are available
   */
  public setLimit(number: number) { this.remaining = number; }

  /** Create an ActorPool system */
  constructor() { }

  /** Return an actor from the pool, if there is one available */
  public get(): Actor | undefined {
    // TODO:  It would be nice to just use pop(), but that will require changes
    //        to how we put things back into the pool...

    // have we reached our limit?
    if (this.remaining == 0) return;
    // do we need to decrease our limit?
    if (this.remaining != undefined) this.remaining--;

    // is there an available actor?
    if (this.pool[this.nextIndex].enabled) return;
    // get the next actor
    let b = this.pool[this.nextIndex];
    this.nextIndex = (this.nextIndex + 1) % this.pool.length;
    return b;
  }

  /**
   * Place an actor into the pool.  Note that this will disable the actor.
   *
   * @param actor The actor to put into the pool
   */
  public put(actor: Actor) {
    actor.enabled = false;
    this.pool.push(actor);
  }
}
