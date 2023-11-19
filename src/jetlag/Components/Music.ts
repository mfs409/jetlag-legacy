import { ISound } from "../Services/AudioService";

/**
 * MusicComponent manages the background music for a stage
 *
 * TODO:  It should be possible to attach a MusicComponent to the Game object
 *        itself, for music that lives across stages.
 */
export class MusicComponent {
  /** The music, if any */
  private music?: ISound;

  /** Whether the music is playing or not */
  private musicPlaying = false;

  /** If the level has music attached to it, this starts playing it */
  public playMusic() {
    if (!this.musicPlaying && this.music) {
      this.musicPlaying = true;
      this.music.play();
    }
  }

  /** If the level has music attached to it, this pauses it */
  public pauseMusic() {
    if (this.musicPlaying) {
      this.musicPlaying = false;
      this.music!.stop();
    }
  }

  /** If the level has music attached to it, this stops it */
  public stopMusic() {
    if (this.musicPlaying) {
      this.musicPlaying = false;
      this.music!.stop();
    }
  }

  /**
   * Set the music for the stage
   *
   * @param music The music to assign to the stage
   */
  public setMusic(music: ISound) { this.music = music; }

  /** Clear the music for this stage */
  public clear() { this.music = undefined; }
}
