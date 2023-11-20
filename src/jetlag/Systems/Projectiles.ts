import { Actor } from "../Entities/Actor";

/**
 * ProjectileSystem stores a set of projectiles.  We can get into lots of trouble
 * with Box2d if we make too many actors, so the projectile system is a useful
 * mechanism for recycling / reusing projectiles.
 */
export class ProjectileSystem {
  /** A collection of all the available projectiles */
  private pool = [] as Actor[];

  /** For limiting the number of projectiles that can be thrown */
  private remaining?: number;

  /** Index of next available projectile */
  private nextIndex = 0;

  /** Return the number of projectiles remaining */
  public getRemaining() { return this.remaining ?? 0; }

  /**
   * Set a limit on the total number of projectiles that can be thrown
   *
   * @param number How many projectiles are available
   */
  public setNumberOfProjectiles(number: number) { this.remaining = number; }

  /** Create a projectile system */
  constructor() { }

  /** Return an actor from the pool, if there is one available */
  public get(): Actor | undefined {
    // TODO:  It would be nice to just use pop(), but that will require changes
    //        to how we put things back into the pool...

    // have we reached our limit?
    if (this.remaining == 0) return;
    // do we need to decrease our limit?
    if (this.remaining != undefined) this.remaining--;

    // is there an available projectile?
    if (this.pool[this.nextIndex].enabled) return;
    // get the next projectile
    let b = this.pool[this.nextIndex];
    this.nextIndex = (this.nextIndex + 1) % this.pool.length;
    return b;
  }

  /**
   * Place an actor into the pool
   *
   * @param actor The actor to put into the pool
   */
  public put(actor: Actor) {
    this.pool.push(actor);
  }
}
