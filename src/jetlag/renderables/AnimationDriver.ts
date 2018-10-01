import { JLSprite } from "../device/Renderer"
import { JetLagManager } from "../JetLagManager"
import { Animation } from "./Animation"

/**
 * AnimationDriver is an internal class that actors can use to figure out which
 * frame of an animation to show next
 */
export class AnimationDriver {
    /** The currently running animation */
    mCurrentAnimation: Animation;

    /** The images that comprise the current animation will be the elements of this array */
    private mImages: JLSprite[];

    /** The index to display from <code>mImages</code>, for the case where there is no active animation. This is useful for animateByGoodieCount. */
    private mImageIndex: number;

    /** The frame of the currently running animation that is being displayed */
    private mActiveFrame: number;

    /** The amount of time for which the current frame has been displayed */
    private mElapsedTime: number;

    /**
     * Build a Driver by giving it an image name. This allows us to use Driver to
     * display non-animated images
     *
     * @param media   The media object, with all of the game's loaded images
     * @param imgName The name of the image file to use
     */
    constructor(manager: JetLagManager, imgName: string) {
        this.updateImage(manager, imgName);
    }

    /**
     * Set the current animation, so that it will start running
     *
     * @param animation The animation to start using
     */
    setCurrentAnimation(animation: Animation) {
        this.mCurrentAnimation = animation;
        this.mActiveFrame = 0;
        this.mElapsedTime = 0;
    }

    /**
     * Reset the current animation
     */
    resetCurrentAnimation() {
        this.mActiveFrame = 0;
        this.mElapsedTime = 0;
    }

    /**
     * Change the source for the default image to display
     *
     * @param media   The media object, with all of the game's loaded images
     * @param imgName The name of the image file to use
     */
    updateImage(manager: JetLagManager, imgName: string) {
        if (this.mImages == null)
            this.mImages = [null];
        this.mImages[0] = manager.device.renderer.getSprite(imgName);
        this.mImageIndex = 0;
    }

    /**
     * Request a random index from the mImages array to pick an image to display
     *
     * @param generator A random number generator.  We pass in the game's generator, so that we
     *                  can keep the length of the mImages array private
     */
    updateIndex() {
        this.mImageIndex = Math.floor(Math.random() * this.mImages.length);
    }

    /**
     * When an actor renders, we use this method to figure out which image to display
     *
     * @param elapsedMillis The time since the last render
     * @return The TextureRegion to display
     */
    advanceAnimation(elapsedMillis: number) {
        // If we're in 'show a specific image' mode, then don't change anything
        if (this.mCurrentAnimation == null)
            return;

        // Advance the time
        this.mElapsedTime += elapsedMillis;
        let millis = (this.mElapsedTime);
        // are we still in this frame?
        if (millis <= this.mCurrentAnimation.mDurations[this.mActiveFrame])
            return;
        // are we on the last frame, with no loop? If so, stay where we are
        else if (this.mActiveFrame == this.mCurrentAnimation.mCells.length - 1 && !this.mCurrentAnimation.mLoop)
            return;
        // advance the animation and start its timer from zero
        this.mActiveFrame = (this.mActiveFrame + 1) % this.mCurrentAnimation.mCells.length;
        this.mElapsedTime = 0;
        return;
    }

    /**
     * Return the current image for the active animation.
     */
    getCurrent() {
        // If we're in "show a specific image" mode, return the image to show
        if (this.mCurrentAnimation == null)
            return this.mImages[this.mImageIndex];
        // return the current item
        return this.mCurrentAnimation.mCells[this.mActiveFrame];
    }
}