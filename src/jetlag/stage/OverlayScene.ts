import { Scene } from "../stage/Scene"
import { JetLagRenderer } from "../misc/JetLagDevice";

/**
 * OverlayScene is any scene that sits on top of the world.  The most important 
 * one of these is for the "heads-up display", where we put information and 
 * buttons on top of the game.
 * 
 * All this really adds to a Scene is a way to be rendered.  The interesting
 * stuff is what we attach to an OverlayScene via the OverlayApi.
 */
export class OverlayScene extends Scene {
    /**
     * Draw the OverlayScene
     *
     * @param sb            The spritebatch to use when drawing
     * @param elapsedMillis The time since the last render
     */
    render(renderer: JetLagRenderer, elapsedMillis: number) {
        // advance timers and world
        //
        // TODO: should we be using elapsedMillis for the Step?
        this.timer.advance(elapsedMillis);
        this.world.Step(1 / 45, 8, 3);

        // Draw everything
        for (let zPlane of this.renderables) {
            for (let renderable of zPlane) {
                renderable.render(renderer, this.camera, elapsedMillis);
            }
        }
        return true;
    }
}