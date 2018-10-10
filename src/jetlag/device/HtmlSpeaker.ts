import { Howl, Howler } from 'howler';
import { JetLagConfig } from "../JetLagConfig"
import { JetLagSpeaker } from '../support/Interfaces';
import { HtmlConsole } from './HtmlConsole';

/**
 * HtmlSpeaker provides a store of sound and music objects that can be played at
 * any time.  The only difference between sounds and music is that music objects
 * will always loop, whereas sound objects never will.
 */
export class HtmlSpeaker implements JetLagSpeaker {
    /** All of the sounds (non-looping audio) in the game, by name */
    private readonly sounds: { [index: string]: Howl } = {};

    /** All of the music (looping audio) in the game, by name */
    private readonly music: { [index: string]: Howl } = {};

    /**
     * Create an audio object by loading all of the game's audio files
     * 
     * @param config The game-wide configuration
     * @param console A console, for printing error messages
     */
    constructor(config: JetLagConfig, private console: HtmlConsole) {
        for (let name of config.soundNames) {
            this.sounds[name] = new Howl({ src: [config.resourcePrefix + name] });
        }
        for (let name of config.musicNames) {
            this.music[name] = new Howl({ src: [config.resourcePrefix + name], loop: true });
        }
    }

    /**
     * Get a previously loaded Sound object
     *
     * @param soundName Name of the sound file to retrieve
     */
    getSound(soundName: string) {
        let ret: Howl = this.sounds[soundName];
        if (!ret) {
            this.console.info("Error retrieving sound '" + soundName + "'");
        }
        return ret;
    }

    /**
     * Get a previously loaded Music object
     *
     * @param musicName Name of the music file to retrieve
     */
    getMusic(musicName: string) {
        let ret: Howl = this.music[musicName];
        if (!ret) {
            this.console.info("Error retrieving music '" + musicName + "'");
        }
        return ret;
    }

    /** On a volume change event, make sure all Music objects are updated */
    public resetMusicVolume(volume: number) {
        Howler.volume(volume);
    }
}