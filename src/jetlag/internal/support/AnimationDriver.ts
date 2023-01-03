import { Animation } from "../../support/Animation"
import { JetLagSprite, JetLagRenderer } from "./Interfaces";

/**
 * AnimationDriver is an internal class that actors can use to figure out which
 * frame of an animation to show next
 */
export class AnimationDriver {
    /** The currently running animation */
    private currentAnimation?: Animation;

    /** 
     * The images that comprise the current animation will be the elements of
     * this array 
     */
    private images: JetLagSprite[] = [];

    /** 
     * The index to display from images, for the case where there is no active
     * animation. This is useful for animateByGoodieCount.
     */
    private imageIndex = 0;

    /** The frame of the currently running animation that is being displayed */
    private activeFrame = 0;

    /** The amount of time for which the current frame has been displayed */
    private elapsedTime = 0;

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

    /** Return the current Animation that is being run */
    public getCurrentAnimation() { return this.currentAnimation; }

    /**
     * Set the current animation, so that it will start running
     *
     * @param animation The animation to start using
     */
    public setCurrentAnimation(animation: Animation) {
        this.currentAnimation = animation;
        this.activeFrame = 0;
        this.elapsedTime = 0;
    }

    /** Reset the current animation */
    public resetCurrentAnimation() {
        this.activeFrame = 0;
        this.elapsedTime = 0;
    }

    /**
     * Change the source for the default image to display
     *
     * @param media   The media object, with all of the game's loaded images
     * @param imgName The name of the image file to use
     */
    public updateImage(renderer: JetLagRenderer, imgName: string) {
        this.images[0] = renderer.getSprite(imgName);
        this.imageIndex = 0;
    }

    /**
     * When an actor renders, we use this method to figure out which image to
     * display
     *
     * @param elapsedMillis The time since the last render
     * @return The TextureRegion to display
     */
    public advanceAnimation(elapsedMillis: number) {
        // If we're in 'show a specific image' mode, then don't change anything
        if (!this.currentAnimation)
            return;

        // Advance the time
        this.elapsedTime += elapsedMillis;
        let millis = (this.elapsedTime);

        // are we still in this frame?
        if (millis <= this.currentAnimation.getCellDuration(this.activeFrame))
            return;

        // are we on the last frame, with no loop? If so, stay where we are
        else if (this.activeFrame == this.currentAnimation.getNumCells() - 1 &&
            !this.currentAnimation.getLoop()) {
            return;
        }

        // advance the animation and start its timer from zero
        this.activeFrame = (this.activeFrame + 1) % this.currentAnimation.getNumCells();
        this.elapsedTime = 0;
    }

    /** Return the current image for the active animation. */
    public getCurrent() {
        // If we're in "show a specific image" mode, return the image to show
        if (!this.currentAnimation)
            return this.images[this.imageIndex];
        // return the current item
        return this.currentAnimation.getCell(this.activeFrame);
    }
}