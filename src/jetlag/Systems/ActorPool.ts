import { Actor } from "../Entities/Actor";

/**
 * ActorPool stores a bunch of actors.  We can get into trouble in Box2d if we
 * make too many single-use actors, so the ActorPool is a useful mechanism for
 * recycling / reusing actors.
 */
export class ActorPoolSystem {
  /** A collection of all the available actors */
  private pool = [] as Actor[];

  /** For limiting the number of actors that can be returned */
  private remaining?: number;

  /** Index of next available actor */
  private nextIndex = 0;

  /** Return the number of actors remaining */
  public getRemaining() { return this.remaining ?? 0; }

  /**
   * Set a limit on the total number of actors that can be used
   *
   * @param number How many actors are available
   */
  public setLimit(number: number) { this.remaining = number; }

  /**
   * Return an actor from the pool, if there is one available
   *
   * Note that this can return `undefined`.  If you don't want that behavior,
   * consider adding more actors to the pool.
   */
  public get(): Actor | undefined {
    // NB:  We don't use pop(), because that would require pooled actors to know
    //      which pool they came from

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
