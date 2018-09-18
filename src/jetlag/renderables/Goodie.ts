import { WorldActor } from "./WorldActor"
import { JetLagManager } from "../JetLagManager"
import { WorldScene } from "../stage/WorldScene"
import { Hero } from "./Hero"

/**
 * Goodies are actors that a hero can collect.
 *
 * Collecting a goodie has three possible consequences: it can change the score, it can change the
 * hero's strength, and it can make the hero invincible
 */
export class Goodie extends WorldActor {
  onHeroCollect: (g: Goodie, h: Hero) => void = null;

  /**
   * The "score" of this goodie... it is the amount that will be added to the
   * score when the goodie is collected. This is different than a hero's
   * strength because this actually bumps the score, which in turn lets us have
   * "super goodies" that turn on callback obstacles.
   */
  score: number[] = [];

  /**
  * Create a basic Goodie.  The goodie won't yet have any physics attached to it.
  *
  * @param game    The currently active game
  * @param scene   The scene into which the destination is being placed
  * @param width   width of this Goodie
  * @param height  height of this Goodie
  * @param imgName image to use for this Goodie
  */
  constructor(manager: JetLagManager, scene: WorldScene, width: number, height: number, imgName: string) {
    super(manager, scene, imgName, width, height);
    this.score[0] = 1;
    this.score[1] = 0;
    this.score[2] = 0;
    this.score[3] = 0;
  }

  /**
  * Code to run when a Goodie collides with a WorldActor.
  * <p>
  * NB: Goodies are at the end of the collision hierarchy, so we don't do anything when
  * they are in a collision that hasn't already been handled by a higher-ranked WorldActor.
  *
  * @param other   Other object involved in this collision
  * @param contact A description of the contact that caused this collision
  */
  onCollide(other: WorldActor, contact: PhysicsType2d.Dynamics.Contacts.Contact): void {
  }

  /**
   * Set the score of this goodie.
   *
   * This indicates how many points the goodie is worth... each value can be positive or negative
   *
   * @param v1 The number of points that are added to the 1st score when the goodie is collected
   * @param v2 The number of points that are added to the 2nd score when the goodie is collected
   * @param v3 The number of points that are added to the 3rd score when the goodie is collected
   * @param v4 The number of points that are added to the 4th score when the goodie is collected
   */
  public setScore(v1: number, v2: number, v3: number, v4: number) {
    this.score[0] = v1;
    this.score[1] = v2;
    this.score[2] = v3;
    this.score[3] = v4;
  }
}