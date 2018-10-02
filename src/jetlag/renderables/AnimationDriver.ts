import { Animation } from "./Animation"
import { JetLagSprite, JetLagRenderer } from "../misc/JetLagDevice";

/**
 * AnimationDriver is an internal class that actors can use to figure out which
 * frame of an animation to show next
 */
export class AnimationDriver {
    /** The currently running animation */
    currentAnimation: Animation;

    /** 
     * The images that comprise the current animation will be the elements of
     * this array 
     */
    private images: JetLagSprite[];

    /** 
     * The index to display from images, for the case where there is no active
     * animation. This is useful for animateByGoodieCount.
     */
    private imageIndex: number;

    /** The frame of the currently running animation that is being displayed */
    private activeFrame: number;

    /** The amount of time for which the current frame has been displayed */
    private elapsedTime: number;

    /**
     * Build an AnimationDriver by giving it an image name. This allows us to
     * use Driver to display non-animated images
     *
     * @param renderer The renderer, so we can get one of its images by name
     * @param imgName  The name of the image file to use
     */
    constructor(renderer: JetLagRenderer, imgName: string) {
        this.updateImage(renderer, imgName);
    }

    /**
     * Set the current animation, so that it will start running
     *
     * @param animation The animation to start using
     */
    setCurrentAnimation(animation: Animation) {
        this.currentAnimation = animation;
        this.activeFrame = 0;
        this.elapsedTime = 0;
    }

    /** Reset the current animation */
    resetCurrentAnimation() {
        this.activeFrame = 0;
        this.elapsedTime = 0;
    }

    /**
     * Change the source for the default image to display
     *
     * @param media   The media object, with all of the game's loaded images
     * @param imgName The name of the image file to use
     */
    updateImage(renderer: JetLagRenderer, imgName: string) {
        if (this.images == null)
            this.images = [null];
        this.images[0] = renderer.getSprite(imgName);
        this.imageIndex = 0;
    }

    /** Choose a random index from the animation's images */
    switchToRandomIndex() {
        this.imageIndex = Math.floor(Math.random() * this.images.length);
    }

    /**
     * When an actor renders, we use this method to figure out which image to
     * display
     *
     * @param elapsedMillis The time since the last render
     * @return The TextureRegion to display
     */
    advanceAnimation(elapsedMillis: number) {
        // If we're in 'show a specific image' mode, then don't change anything
        if (this.currentAnimation == null)
            return;

        // Advance the time
        this.elapsedTime += elapsedMillis;
        let millis = (this.elapsedTime);

        // are we still in this frame?
        if (millis <= this.currentAnimation.durations[this.activeFrame])
            return;

        // are we on the last frame, with no loop? If so, stay where we are
        else if (this.activeFrame == this.currentAnimation.cells.length - 1 &&
            !this.currentAnimation.loop) {
            return;
        }

        // advance the animation and start its timer from zero
        this.activeFrame = (this.activeFrame + 1) %
            this.currentAnimation.cells.length;
        this.elapsedTime = 0;
    }

    /** Return the current image for the active animation. */
    getCurrent() {
        // If we're in "show a specific image" mode, return the image to show
        if (this.currentAnimation == null)
            return this.images[this.imageIndex];
        // return the current item
        return this.currentAnimation.cells[this.activeFrame];
    }
}