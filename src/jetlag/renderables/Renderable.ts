import { Renderer, Camera } from "../device/Renderer"

/**
 * Renderable encapsulates anything that can be drawn on the screen.  In LOL-TS,
 * there are three ways that we might draw to the screen:
 * - Actor: has a physics body; uses that body to determine an image's x/y/theta
 * - Text: no physics body; must have an x/y/theta on its own
 * - Picture: no physics body; must have an x/y/theta on its own
 */
export interface Renderable {
  /**
   * Render something to the screen.  If the object needs to be updated before
   * rendering, do it here, too.  If the object should be culled (not rendered
   * because it isn't in view), that should be done here too.
   */
  render(renderer: Renderer, camera: Camera, elapsedMillis: number): void;
}