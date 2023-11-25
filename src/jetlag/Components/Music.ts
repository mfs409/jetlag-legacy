import { ISound } from "../Services/AudioLibrary";

/** MusicComponent manages the background music for a stage */
export class MusicComponent {
  /** Whether the music is playing or not */
  private musicPlaying = false;

  /** If the level has music attached to it, this starts playing it */
  public play() {
    if (!this.musicPlaying && this.music) {
      this.musicPlaying = true;
      this.music.play();
    }
  }

  /** If the level has music attached to it, this pauses it */
  public pause() {
    if (this.music && this.musicPlaying) {
      this.musicPlaying = false;
      this.music.pause();
    }
  }

  /** If the level has music attached to it, this stops it */
  public stop() {
    if (this.music && this.musicPlaying) {
      this.musicPlaying = false;
      this.music.stop();
    }
  }

  /**
   * Construct a MusicComponent by providing a music object to play
   *
   * @param music The music object to use
   */
  constructor(private music?: ISound) { }
}
