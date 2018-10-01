import { JetLagSprite } from "../device/Renderer"
import { Renderer } from "../device/Renderer"

/**
 * Animation is a way of describing a set of images that can be used to do flip-book animation on
 * any actor.  Animations consist of the names of images, and the time that each should be shown.
 * 
 * There are two ways to make an animation. The more powerful uses to() to chain
 * together frame/duration pairs. The less powerful uses a constructor with more
 * parameters to define the entire animation in equal-duration pieces.
 */
export class Animation {
    /** A set of images that can be used as frames of an animation. */
    mCells: JetLagSprite[];

    /** Should the animation repeat? */
    mLoop: boolean;

    /** This array holds the durations for which each of the images should be displayed */
    mDurations: number[];

    /** The renderer, so we can look up sprites */
    renderer: Renderer;

    /** Make a clone of this animation */
    clone() {
        let a = new Animation(this.mLoop, this.renderer);
        for (let i = 0; i < this.mDurations.length; ++i) {
            a.mDurations.push(this.mDurations[i]);
            a.mCells.push(this.renderer.getSprite(this.mCells[i].imgName));
        }
        return a;
    }

    /**
     * Create the shell of a complex animation. The animation can hold up to sequenceCount steps,
     * but none will be initialized yet. After constructing like this, a programmer should use the
     * "to" method to initialize the steps.
     *
     * @param media         The Media object, with references to all images that comprise the game
     * @param sequenceCount The number of frames in the animation
     * @param repeat        Either true or false, depending on whether the animation should repeat
     */
    constructor(repeat: boolean, renderer: Renderer) {
        this.mCells = [];
        this.mDurations = [];
        this.mLoop = repeat;
        this.renderer = renderer;
    }

    /**
     * Get the duration of the entire animation sequence
     * @return The duration, in milliseconds
     */
    getDuration(): number {
        let result = 0;
        for (let l of this.mDurations)
            result += l;
        return result;
    }

    /**
     * Add a step to an animation
     *
     * @param imgName  The name of the image to add to the animation
     * @param duration The time in milliseconds that this image should be shown
     * @return the Animation, so that we can chain calls to "to()"
     */
    public to(imgName: string, duration: number): Animation {
        this.mCells.push(this.renderer.getSprite(imgName));
        this.mDurations.push(duration);
        return this;
    }
}