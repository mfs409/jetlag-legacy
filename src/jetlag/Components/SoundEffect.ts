// Last review: 08-10-2023

import { game } from "../Stage";
import { ISound } from "../Services/AudioService";

/** All audio-related aspects of an actor get stored here */
export class SoundEffectComponent {
  /** Sound to play when the actor disappears */
  public disappearSound: ISound;

  /**
   * Request that a sound plays whenever this actor disappears
   *
   * @param soundName The name of the sound file to play
   */
  constructor(soundName: string) {
    this.disappearSound = game.musicLibrary.getSound(soundName);
  }
}
