import { ParallaxLayer } from "../support/ParallaxLayer"
import { Camera } from "../support/Camera"
import { JetLagRenderer } from "../support/Interfaces";
import { JetLagConfig } from "../../support/JetLagConfig";

/**
 * ParallaxScenes present a set of images that seem to scroll relative to the 
 * position of the actor on whom the camera is centered.
 * 
 * The speeds of layers are a very important concept.
 * - 1 means "moves at same speed as hero", which means "fixed position"
 * - 0 means "doesn't move", which means "looks like a tiled background"
 * - in-between should be interesting
 */
export class ParallaxScene {
    /** All the layers to show as part of this scene */
    private layers: ParallaxLayer[] = [];

    /**
     * Create a ParallaxScene
     *
     * @param config The game-wide configuration object
     */
    constructor(private config: JetLagConfig) { }

    /**
     * Add a parallax layer to the current level
     * 
     * @param layer The new layer
     */
    public addLayer(layer: ParallaxLayer) { this.layers.push(layer); }

    /**
     * Render all of the layers of this parallax scene
     *
     * @param renderer    The device renderer context
     * @param worldCamera The camera for the world that these layers accompany
     * @param elapsed     The time since the last render
     */
    public render(renderer: JetLagRenderer, worldCamera: Camera, elapsed: number) {
        for (let pl of this.layers) {
            pl.render(renderer, worldCamera, elapsed, this.config);
        }
    }
}