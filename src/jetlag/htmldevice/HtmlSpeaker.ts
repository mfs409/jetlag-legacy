import { Howl, Howler } from 'howler';
import { JetLagConfig } from "../JetLagConfig"
import { Logger } from '../misc/Logger';
import { JetLagSpeaker } from '../misc/JetLagDevice';

/**
 * Audio provides a store of sound and music objects that can be played at any
 * time.  The only difference between sounds and music is that music objects
 * will always loop, whereas sound objects never will.
 * 
 * NB: We've probably got too thin a wrapper around Howler.js, but it's fine for now.
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
     */
    constructor(config: JetLagConfig) {
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
     * @return a Sound object that can be used for sound effects
     */
    getSound(soundName: string) {
        let ret: Howl = this.sounds[soundName];
        if (!ret) {
            Logger.info("Error retrieving sound '" + soundName + "'");
        }
        return ret;
    }

    /**
     * Get a previously loaded Music object
     *
     * @param musicName Name of the music file to retrieve
     * @return a Music object that can be used to play background music
     */
    getMusic(musicName: string) {
        let ret: Howl = this.music[musicName];
        if (!ret) {
            Logger.info("Error retrieving music '" + musicName + "'");
        }
        return ret;
    }

    /** On a volume change event, make sure all Music objects are updated */
    public resetMusicVolume(volume: number) {
        Howler.volume(volume);
    }
}