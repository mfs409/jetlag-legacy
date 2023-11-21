// TODO: Code Review

import { b2Vec2 } from "@box2d/core";
import { Actor } from "../Entities/Actor";
import { stage } from "../Stage";

/**
 * The Camera is used to determine /how much/ of a world to render.  The Camera
 * has a minimum X and Y coordinate, and a maximum X and Y coordinate.  It also
 * has a zoom factor, and a current center point.
 *
 * The zoom factor and center point give a rectangular region.  The min and max
 * coordinates give another rectangular region.  If the first region is not
 * fully within the second, we shift it so that it is within, and then we only
 * show those things that are within it.
 *
 * Note that the camera center can be changed dynamically, in response to
 * changes in the world to which the camera is attached.
 */
export class CameraSystem {
  /** Anything in the world that can be rendered (5 planes [-2, -1, 0, 1, 2]) */
  protected readonly renderables: Actor[][] = [[], [], [], [], []];

  /** The minimum x coordinate that can be shown (left) */
  private minX: number | undefined = undefined;

  /** The minimum y coordinate that can be shown (top) */
  private minY: number | undefined = undefined;

  /** The maximum x coordinate that can be shown (right) */
  private maxX: number | undefined = undefined;

  /** The maximum y coordinate that can be shown (bottom) */
  private maxY: number | undefined = undefined;

  /** The current center point of the camera */
  private readonly center = new b2Vec2(0, 0);

  /** The effective (scaled) pixel/meter ratio */
  private ratio: number;

  /** The dimensions of the screen, in pixels */
  private readonly screenDims = new b2Vec2(0, 0);

  /** The visible dimensions of the screen, in meters */
  private readonly scaledVisibleRegionDims = new b2Vec2(0, 0);

  /** The Entity that the camera chases, if any */
  private cameraChaseActor?: Actor;

  /**
   * When the camera follows the entity without centering on it, this gives us
   * the difference between the entity and camera
   */
  private readonly cameraOffset = new b2Vec2(0, 0);

  /**
   * Make the camera follow an Actor.  Optionally add x,y to the actor's center,
   * and center the camera on that point instead.
   *
   * @param actor The actor to follow
   * @param x     Amount of x distance to add to actor center
   * @param y     Amount of y distance to add to actor center
   */
  public setCameraFocus(actor: Actor | undefined, x: number = 0, y: number = 0) {
    this.cameraChaseActor = actor;
    this.cameraOffset.Set(x, y);
  }

  /**
   * If the world's camera is supposed to follow an entity, this code will
   * figure out the point on which the camera should center, and will request
   * that the camera center on that point.
   *
   * NB: The camera may decide not to center on that point, depending on zoom
   *     and camera bounds.
   */
  public adjustCamera() {
    if (!this.cameraChaseActor) return;

    // figure out the entity's position + the offset
    let a = this.cameraChaseActor;
    let x = a.rigidBody.body.GetWorldCenter().x + this.cameraOffset.x;
    let y = a.rigidBody.body.GetWorldCenter().y + this.cameraOffset.y;

    // request that the camera center on that point
    this.setCenter(x, y);
  }

  /**
   * Create a Camera by setting its bounds and its current pixel/meter ratio
   *
   * @param ratio The initial pixel/meter ratio
   */
  constructor(ratio: number) {
    // set up the game camera, with (0, 0) in the top left
    let w = stage.screenWidth / ratio;
    let h = stage.screenHeight / ratio;

    this.center.Set(w / 2, h / 2);
    this.screenDims.Set(stage.screenWidth, stage.screenHeight);
    this.ratio = ratio;
    this.setScale(this.ratio);

    // set up the containers for holding anything we can render
    this.renderables = new Array<Array<Actor>>(5);
    for (let i = 0; i < 5; ++i)
      this.renderables[i] = new Array<Actor>();
  }

  /**
   * Get the pixel/meter ratio of the camera.  Increasing the ratio would
   * equate to zooming in.  Decreasing the ratio would equate to zooming out.
   */
  public getScale(): number { return this.ratio; }

  /**
   * Set the pixel/meter ratio of the camera.  Bigger numbers mean zooming in,
   * and smaller ones mean zooming out.  The base value to consider is whatever
   * you have set in your game's configuration.
   *
   * @param ratio The new pixel/meter ratio
   */
  public setScale(ratio: number) {
    this.ratio = ratio;
    // Update our precomputed visible screen dimensions
    this.scaledVisibleRegionDims.Set(this.screenDims.x / ratio, this.screenDims.y / ratio);
    // Warn if the new scale is too small to fill the screen
    this.checkDims();
  }

  /**
   * Update a camera's bounds by providing a new maximum (X, Y) coordinate
   *
   * @param maxX The new maximum X value (in meters)
   * @param maxY The new maximum Y value (in meters)
   */
  public setBounds(minX: number | undefined, minY: number | undefined, maxX: number | undefined, maxY: number | undefined) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    // Warn if the new bounds are too small to fill the screen
    this.checkDims();
  }

  /**
   * Set the center point on which the camera should focus
   *
   * NB: this is called (indirectly) by the render loop in order to make sure
   *     we don't go out of bounds.
   *
   * @param centerX The X coordinate of the center point (in meters)
   * @param centerY The Y coordinate of the center point (in meters)
   */
  public setCenter(centerX: number, centerY: number) {
    // Make sure that X and Y aren't so close to an edge as to lead to
    // out-of-bounds stuff being rendered (modulo warnings from checkDims())
    let top = centerY - this.scaledVisibleRegionDims.y / 2;
    let bottom = centerY + this.scaledVisibleRegionDims.y / 2;
    let left = centerX - this.scaledVisibleRegionDims.x / 2;
    let right = centerX + this.scaledVisibleRegionDims.x / 2;

    this.center.Set(centerX, centerY);

    if (this.maxY != undefined && bottom > this.maxY)
      this.center.y = this.maxY - this.scaledVisibleRegionDims.y / 2;
    if (this.minY != undefined && top < this.minY)
      this.center.y = this.minY + this.scaledVisibleRegionDims.y / 2;
    if (this.maxX != undefined && right > this.maxX)
      this.center.x = this.maxX - this.scaledVisibleRegionDims.x / 2;
    if (this.minX != undefined && left < this.minX)
      this.center.x = this.minX + this.scaledVisibleRegionDims.x / 2;
  }

  /**
   * Determine whether a sprite is within the region being shown by the
   * camera, so that we can reduce the overhead on the renderer.
   *
   * @param x The X coordinate of the top left corner of the sprite, in meters
   * @param y The Y coordinate of the top left corner of the sprite, in meters
   * @param r The radius of the circumscribing circle
   */
  public inBounds(x: number, y: number, r: number): boolean {
    let leftOk = x + r >= this.center.x - this.scaledVisibleRegionDims.x / 2;
    let rightOk = x - r <= this.center.x + this.scaledVisibleRegionDims.x / 2;
    let topOk = y + r >= this.center.y - this.scaledVisibleRegionDims.y / 2;
    let bottomOk = y - r <= this.center.y + this.scaledVisibleRegionDims.y / 2;
    return leftOk && rightOk && topOk && bottomOk;
  }

  /** Return the X coordinate of the left of the camera viewport */
  public getOffsetX() { return this.center.x - this.scaledVisibleRegionDims.x / 2; }

  /** Return the Y coordinate of the top of the camera viewport */
  public getOffsetY() { return this.center.y - this.scaledVisibleRegionDims.y / 2; }

  /**
   * Given screen coordinates, convert them to meter coordinates in the world
   *
   * @param screenX The X coordinate, in pixels
   * @param screenY The Y coordinate, in pixels
   */
  public screenToMeters(screenX: number, screenY: number) {
    return { x: screenX / this.ratio + this.getOffsetX(), y: screenY / this.ratio + this.getOffsetY() };
  }

  /**
   * Convert meter coordinates to screen coordinates
   *
   * @param worldX  The X coordinate, in meters
   * @param worldY  The Y coordinate, in meters
   */
  public metersToScreen(worldX: number, worldY: number) {
    return { x: (worldX - this.getOffsetX()) * this.ratio, y: (worldY - this.getOffsetY()) * this.ratio };
  }

  /**
   * Check to make sure that the current screen bounds, scaled by the current
   * pixel/meter ratio, are at least as big as the screen dimensions.
   */
  private checkDims() {
    // w and h are the visible world's width and height in pixels
    if (this.maxX != undefined && this.minX != undefined) {
      let w = this.ratio * (this.maxX - this.minX);
      if (w < this.screenDims.x) stage.console.log("Warning, the visible game area is less than the screen width");
    }

    if (this.maxY != undefined && this.minY != undefined) {
      let h = this.ratio * (this.maxY - this.minY);
      if (h < this.screenDims.y) stage.console.log("Warning, the visible game area is less than the screen height");
    }
  }

  /**
   * Add an actor to the level, putting it into the appropriate z plane
   *
   * @param actor The actor to add
   */
  addEntity(actor: Actor) {
    this.renderables[actor.appearance.props.z + 2].push(actor);
  }

  /**
   * Remove an actor from its z plane
   *
   * @param actor The actor to remove
   */
  removeEntity(actor: Actor) {
    let z = actor.appearance.props.z
    let i = this.renderables[z + 2].indexOf(actor);
    this.renderables[z + 2].splice(i, 1);
  }

  /**
   * Render this scene
   *
   * @return True if the scene was rendered, false if it was not
   */
  render(elapsedMs: number) {
    // Draw everything
    for (let zPlane of this.renderables)
      for (let renderable of zPlane)
        if (renderable.prerender(elapsedMs)) renderable.appearance?.render(this, elapsedMs);
    return true;
  }
}
