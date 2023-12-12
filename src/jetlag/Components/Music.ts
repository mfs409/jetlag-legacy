import { ISound } from "../Services/AudioLibrary";

/** MusicComponent manages the background music for a stage */
export class MusicComponent {
  /** If the level has music attached to it, this starts playing it */
  public play() { if (this.music && !this.music.playing()) this.music.play(); }

  /** If the level has music attached to it, this pauses it */
  public pause() { if (this.music && this.music.playing()) this.music.pause(); }

  /** If the level has music attached to it, this stops it */
  public stop() { if (this.music && this.music.playing()) this.music.stop(); }

  /**
   * Construct a MusicComponent by providing a music object to play.
   *
   * @param music The music object to use
   */
  constructor(private music?: ISound) { }
}
