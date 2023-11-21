// TODO: Code Review

import { stage } from "../Stage";
import { ISound } from "../Services/AudioLibrary";

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
    this.disappearSound = stage.musicLibrary.getSound(soundName);
  }
}
