import { stage } from "../Stage";
import { ISound } from "../Services/AudioLibrary";

/**
 * SoundEffect provides a set of sounds associated with events that can happen
 * to an actor.  This lets us easily know which sound to play without having to
 * rely on a callback.  Note that this component has the full set of possible
 * sounds, even though not all are appropriate for any single actor.
 */
export class SoundEffectComponent {
  /** Sound to play when the actor disappears */
  public disappear: ISound | undefined;

  /** Sound to play when the actor tosses a projectile */
  public toss: ISound | undefined;

  /** Sound to play upon an arrival at a destination */
  public arrive: ISound | undefined;

  /** Sound to play when an actor is defeated */
  public defeat: ISound | undefined;

  /** Sound to play when an actor jumps */
  public jump: ISound | undefined;

  /** Sound to play when there a collision with this actor */
  public collide: ISound | undefined;

  /**
   * Construct a SoundEffectComponent from the file names of the sounds to play
   * on events.
   *
   * @param config  An object with the names of the sounds for events for which
   *                a sound should play
   */
  constructor(config: { disappear?: string, toss?: string, arrive?: string, defeat?: string, jump?: string, collide?: string }) {
    if (config.disappear) this.disappear = stage.musicLibrary.getSound(config.disappear);
    if (config.toss) this.toss = stage.musicLibrary.getSound(config.toss);
    if (config.arrive) this.arrive = stage.musicLibrary.getSound(config.arrive);
    if (config.defeat) this.defeat = stage.musicLibrary.getSound(config.defeat);
    if (config.jump) this.jump = stage.musicLibrary.getSound(config.jump);
    if (config.collide) this.collide = stage.musicLibrary.getSound(config.collide);
  }
}
