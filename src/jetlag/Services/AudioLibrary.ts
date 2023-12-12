import { Howl, Howler } from "howler";
import { JetLagGameConfig } from "../Config";
import { stage } from "../Stage";

/**
 * An abstract representation of a sound
 *
 * We use ISound so that the rest of JetLag doesn't need to know about Howler,
 * but an ISound is really just a Howl object.
 *
 * TODO:  pause() is a reasonable choice for background music, but sound effects
 *        don't currently pause when a pause screen is showing.
 */
export interface ISound {
  /** Play the sound */
  play(): void;
  /** Stop playing the sound */
  stop(): void;
  /** Pause the sound, so we can resume it later */
  pause(): void;
  /** Report if the sound is currently playing */
  playing(): boolean;
}

/**
 * AudioLibraryService provides a library of sound and music objects that can be
 * played at any time.  The only difference between sounds and music is that
 * music objects will always loop, whereas sound objects never will.
 */
export class AudioLibraryService {
  /** All of the sounds (non-looping audio) in the game, by name */
  private readonly sounds: { [index: string]: ISound } = {};

  /** All of the music (looping audio) in the game, by name */
  private readonly music: { [index: string]: ISound } = {};

  /**
   * Create the service by loading all of the game's audio files
   *
   * @param config The game-wide configuration
   */
  constructor(config: JetLagGameConfig) {
    for (let name of config.soundNames!)
      this.sounds[name] = new Howl({ src: [config.resourcePrefix + name] });
    for (let name of config.musicNames!)
      this.music[name] = new Howl({ src: [config.resourcePrefix + name], loop: true });
  }

  /**
   * Get a previously loaded Sound object
   *
   * @param soundName Name of the sound file to retrieve
   */
  getSound(soundName: string) {
    let ret = this.sounds[soundName];
    if (!ret)
      stage.console.log("Error retrieving sound '" + soundName + "'");
    return ret;
  }

  /**
   * Get a previously loaded Music object
   *
   * @param musicName Name of the music file to retrieve
   */
  getMusic(musicName: string) {
    let ret = this.music[musicName];
    if (!ret)
      stage.console.log("Error retrieving music '" + musicName + "'");
    return ret;
  }

  /** On a volume change event, make sure all Music objects are updated */
  public resetMusicVolume(volume: number) { Howler.volume(volume); }
}
