import { JetLagRenderer, JetLagSprite } from "./Interfaces";

/**
 * Animation is a way of describing a set of images that can be used to do
 * flip-book animation on any actor.  Animations consist of the names of images,
 * and the time that each should be shown.
 */
export class Animation {
    /** A set of images that can be used as frames of an animation. */
    cells: JetLagSprite[];

    /** Should the animation repeat? */
    loop: boolean;

    /** 
     * This array holds the durations for which each of the images should be
     * displayed 
     */
    durations: number[];

    /** Make a clone of this animation */
    clone() {
        let a = new Animation(this.loop, this.renderer);
        for (let i = 0; i < this.durations.length; ++i) {
            a.durations.push(this.durations[i]);
            a.cells.push(this.renderer.getSprite(this.cells[i].getImgName()));
        }
        return a;
    }

    /**
     * Create the shell of a flipbook-style animation.  Once the shell is
     * created, use "to()" to add steps to the animation.
     *
     * @param repeat   Either true or false, depending on whether the animation
     *                 should repeat
     * @param renderer The renderer to use (needed to find sprites)
     */
    constructor(repeat: boolean, public renderer: JetLagRenderer) {
        this.cells = [];
        this.durations = [];
        this.loop = repeat;
    }

    /**
     * Get the duration of the entire animation sequence
     * 
     * @return The duration, in milliseconds
     */
    getDuration(): number {
        let result = 0;
        for (let l of this.durations)
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
        this.cells.push(this.renderer.getSprite(imgName));
        this.durations.push(duration);
        return this;
    }
}