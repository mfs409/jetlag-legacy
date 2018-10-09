import { WorldActor as WorldActor } from "./World"
import { Hero } from "./Hero"
import { JetLagStage } from "../JetLagStage";

/**
 * Goodies are actors that a hero can collect.
 *
 * Collecting a goodie can change the score, and/or it can cause a callback
 * to run.
 */
export class Goodie extends WorldActor {
  /** A callback to run when the hero collects this goodie */
  private collectCallback: (g: Goodie, h: Hero) => void = null;

  /**
   * The "score" of this goodie... it is the amount that will be added to the
   * score when the goodie is collected. This is different than a hero's
   * strength because this actually bumps the score, which in turn lets us have
   * "super goodies" that turn on callback obstacles.
   */
  private score = [1, 0, 0, 0];

  /**
   * Create a basic Goodie.  The goodie won't yet have any physics attached to
   * it.
   *
   * @param game    The currently active game
   * @param scene   The scene into which the destination is being placed
   * @param width   width of this Goodie
   * @param height  height of this Goodie
   * @param imgName image to use for this Goodie
   */
  constructor(stage: JetLagStage, width: number, height: number, imgName: string, z: number) {
    super(stage, imgName, width, height, z);
  }

  /**
   * Return the value that gets added to the score when this goodie is collected
   * 
   * @param which The goodie score to return (0-3)
   */
  public getScore(which: number) { return this.score[which]; }

  /** Return the code to run when a hero collects this goodie */
  public getCollectCallback() { return this.collectCallback; }

  /**
   * Provide code to run when the hero collects this goodie
   * 
   * @param callback The code to run
   */
  public setCollectCallback(callback: (g: Goodie, h: Hero) => void) {
    this.collectCallback = callback;
  }

  /**
   * Internal method: the code to run when a Goodie collides with a WorldActor.
   *
   * NB: Goodies are at the end of the collision hierarchy, so we don't do
   *     anything when they are in a collision that hasn't already been handled
   *     by a higher-ranked WorldActor.
   *
   * @param other   Other object involved in this collision
   * @param contact A description of the contact that caused this collision
   */
  onCollide(other: WorldActor, contact: PhysicsType2d.Dynamics.Contacts.Contact) { }

  /**
   * Set the score of this goodie.
   *
   * This indicates how many points the goodie is worth... each value can be
   * positive or negative
   *
   * @param v1 The number of points that are added to the 1st score
   * @param v2 The number of points that are added to the 2nd score
   * @param v3 The number of points that are added to the 3rd score
   * @param v4 The number of points that are added to the 4th score
   */
  public setScore(v1: number, v2: number, v3: number, v4: number) {
    this.score = [v1, v2, v3, v4];
  }
}