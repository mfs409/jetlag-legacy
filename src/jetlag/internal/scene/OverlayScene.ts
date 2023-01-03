import { BaseScene } from "./BaseScene"
import { JetLagRenderer } from "../support/Interfaces";

/**
 * OverlayScene is any scene that sits on top of the WorldScene.  The most
 * important one of these is for the "heads-up display", where we put
 * information and buttons on top of the game.  But we also use this for the
 * win/lose/welcome/pause scenes, which we display *instead of* the main
 * WorldScene.
 *
 * All OverlayScene adds to a Scene is a way to be rendered.  The interesting
 * stuff is what we attach to an OverlayScene via the OverlayApi.
 */
export class OverlayScene extends BaseScene {
    /**
     * Draw the OverlayScene
     *
     * @param renderer  The render object to use to draw the scene
     * @param elapsedMs The time since the last render
     */
    render(renderer: JetLagRenderer, elapsedMs: number) {
        // advance timers and world
        //
        // TODO: should we be using elapsedMillis for the Step?
        this.timer.advance(elapsedMs);
        this.world.Step(elapsedMs / 1000, { velocityIterations: 8, positionIterations: 3 });

        // Draw everything
        for (let zPlane of this.renderables) {
            for (let renderable of zPlane) {
                renderable.render(renderer, this.camera, elapsedMs);
            }
        }
        return true;
    }
}