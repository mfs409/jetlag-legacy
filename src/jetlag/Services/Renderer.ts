import { Application, Container, Graphics, BlurFilter, NoiseFilter, SCALE_MODES, Sprite as PixiSprite } from "pixi.js";
import { GodrayFilter, AsciiFilter, OldFilmFilter } from "pixi-filters";
import { stage } from "../Stage";
import { AppearanceComponent, FilledBox, FilledCircle, FilledPolygon, ZIndex } from "../Components/Appearance";
import { RigidBodyComponent, BoxBody, CircleBody, PolygonBody } from "../Components/RigidBody";
import { CameraSystem } from "../Systems/Camera";
import { Sprite, Text } from "./ImageLibrary";
import { b2Vec2 } from "@box2d/core";

/**
 * RenderService is a wrapper around the PIXI Application object.  It
 * initializes the render loop, which fires at a regular interval to tell the
 * game to advance the simulation by some number of milliseconds.  Doing this
 * many times per second is what makes our game work :)
 *
 * <!--
 * As of December 2023, PIXI.js v 7.3.2's '.d.ts' file isn't always exactly
 * correct.  There are a few `as any` casts in this file for dealing with the
 * issues.  Re-check these casts as PIXI.js updates.
 *  -->
 */
export class RendererService {
  /** The pixi application object is responsible for drawing onto a canvas */
  private pixi: Application;

  /**
   * All of the sprites that will be rendered as part of the currently
   * in-progress render, ordered by Z.
   */
  private worldPlaneContainers: [Container, Container, Container, Container, Container];

  /**
   * debugContainer holds outlines for sprites that will be rendered during
   * the currently in-progress render, but only if we are in debug mode.
   */
  private debug?: Container;

  /** The "time" in milliseconds, where 0 is when the game started */
  private elapsed = 0;

  /** The "time" in milliseconds, where 0 is when the game started */
  public get now() { return this.elapsed; }

  /**
   * When in debug mode, this lets us still disable hitboxes.  It's useful for
   * tutorials, otherwise not.
   */
  public suppressHitBoxes = false;

  /** The most recently-taken screenshot */
  public mostRecentScreenShot?: PixiSprite;

  /** Is someone requesting that a new screenshot be taken? */
  public screenshotRequested = false;

  /**
   * Initialize the renderer.
   *
   * @param screenWidth   The width of the screen
   * @param screenHeight  The height of the screen
   * @param domId         The ID of the DOM element into which we will render
   * @param debugMode     True if debug outlines should be drawn
   */
  constructor(screenWidth: number, screenHeight: number, domId: string, debugMode: boolean) {
    // Create a rendering context and attach it to the the DOM
    this.pixi = new Application({ width: screenWidth, height: screenHeight, antialias: false });
    document.getElementById(domId)!.appendChild(this.pixi.view as any);

    // Set up the containers we will use when rendering
    this.worldPlaneContainers = [new Container(), new Container(), new Container(), new Container(), new Container()];
    if (debugMode) this.debug = new Container();
  }

  /**
   * Start the render loop, which will cause the game simulation to start
   * running.
   */
  public startRenderLoop() {
    this.pixi.ticker.add(() => {
      // Remove all state from the renderer
      this.pixi.stage.removeChildren();
      for (let c of this.worldPlaneContainers) c.removeChildren();
      this.debug?.removeChildren();

      // Tell the game to advance by a step.  This will populate the main
      // container
      let x = this.pixi.ticker.elapsedMS;
      this.elapsed += x;
      stage.renderWorld(x);

      // Put the main container into the renderer, so it will be drawn
      for (let c of this.worldPlaneContainers)
        this.pixi.stage.addChild(c);

      // Add the debug container?
      if (this.debug && !this.suppressHitBoxes) this.pixi.stage.addChild(this.debug);

      // Grab a screenshot if we don't have one yet
      if (this.screenshotRequested) {
        this.screenshotRequested = false;
        this.mostRecentScreenShot = new PixiSprite(this.pixi.renderer.generateTexture(this.pixi.stage, { scaleMode: SCALE_MODES.LINEAR, resolution: 1, region: this.pixi.renderer.screen }));
      }

      // Now add the HUD to the renderer
      stage.renderHud(x);
    });
  }


  /**
   * Set the background color of the next frame to a HTML hex value (e.g.,
   * 0xaaffbb)
   */
  public setFrameColor(color: number) {
    this.pixi.renderer.background.color = color;
  }

  /**
   * Draw a rectangle.  You can think of this as a "hit box"
   *
   * @param x     The center x coordinate
   * @param y     The center y coordinate
   * @param w     The width, in pixels
   * @param h     The height, in pixels
   * @param rot   The rotation, in radians
   * @param rect  The PIXI graphics object to (re) use to make the rectangle
   * @param color The color for the outline of the rectangle
   */
  private drawDebugBox(x: number, y: number, w: number, h: number, rot: number, rect: Graphics, color: number) {
    rect.clear();
    rect.lineStyle(1, color);
    rect.drawRect(x, y, w, h);
    rect.position.set(x, y);
    rect.pivot.set(x + w / 2, y + h / 2);
    rect.rotation = rot;
    this.debug!.addChild(rect);
  }

  /**
   * Draw a circle.  You can think of this as a "hit box"
   *
   * @param x       The center x coordinate
   * @param y       The center y coordinate
   * @param radius  The radius, in pixels
   * @param rot     The rotation, in radians
   * @param circ    The PIXI graphics object to (re) use to make the circle
   * @param line    The PIXI graphics object to (re) use to draw the radius
   * @param color   The color for the outline of the rectangle
   */
  private drawDebugCircle(x: number, y: number, radius: number, rot: number, circ: Graphics, line: Graphics, color: number) {
    // Draw the circle
    circ.clear();
    circ.lineStyle(1, color);
    circ.drawCircle(x, y, radius);
    this.debug!.addChild(circ);
    // Also draw a radial line, to indicate rotation
    line.clear();
    line.position.set(x, y);
    line.lineStyle(1, color).moveTo(0, 0).lineTo(radius * Math.cos(rot), radius * Math.sin(rot));
    this.debug!.addChild(line);
  }

  /**
   * Draw a polygon.  You can think of this as a "hit box"
   *
   * @param x     The center x coordinate
   * @param y     The center y coordinate
   * @param rot   The rotation, in radians
   * @param s     The scaling factor for pixels-to-meters
   * @param poly  The vertices of the polygon
   * @param rect  The PIXI graphics object to (re) use to make the polygon
   */
  private drawDebugPoly(x: number, y: number, rot: number, s: number, verts: b2Vec2[], poly: Graphics) {
    // For polygons, we need to translate the points (they are 0-relative in
    // Box2d, we need them to be relative to (x,y))
    poly.clear();
    poly.lineStyle(1, 0xff00ff);
    let pts: number[] = [];
    for (let pt of verts) {
      pts.push(s * pt.x + x);
      pts.push(s * pt.y + y);
    }
    // NB: must repeat start point of polygon in PIXI
    pts.push(s * verts[0].x + x);
    pts.push(s * verts[0].y + y);
    poly.drawPolygon(pts);
    // rotation
    poly.position.set(x, y);
    poly.pivot.set(x, y);
    poly.rotation = rot;
    this.debug!.addChild(poly);
  }

  /**
   * Add a filled sprite (a Pixi Graphic) to the main container
   *
   * @param appearance  The filled sprite to draw
   * @param body        The rigid body that accompanies the filled sprite
   * @param graphic     The graphic context
   * @param camera      The camera (and by extension, the world)
   * @param z           The Z index of the sprite
   */
  public addFilledSpriteToFrame(appearance: FilledBox | FilledCircle | FilledPolygon, body: RigidBodyComponent, graphic: Graphics, camera: CameraSystem, z: ZIndex) {
    graphic.clear();
    // If the actor isn't on screen, skip it
    if (!camera.inBounds(body.getCenter().x, body.getCenter().y, body.radius)) return;
    // Common fields and common appearance configuration:
    let s = camera.getScale();
    let x = s * (body.getCenter().x - camera.getLeft());
    let y = s * (body.getCenter().y - camera.getTop());
    if (appearance.lineWidth && appearance.lineColor)
      graphic.lineStyle(appearance.lineWidth, appearance.lineColor);
    if (appearance.fillColor)
      graphic.beginFill(appearance.fillColor);
    if (appearance instanceof FilledBox) {
      let w = s * appearance.width;
      let h = s * appearance.height;
      graphic.drawRect(x, y, w, h);
      graphic.position.set(x, y);
      graphic.pivot.set(x + w / 2, y + h / 2);
      graphic.rotation = body.getRotation();
    }
    else if (appearance instanceof FilledCircle) {
      let radius = s * appearance.radius;
      graphic.drawCircle(x, y, radius);
    }
    else if (appearance instanceof FilledPolygon) {
      // For polygons, we need to translate the points (they are 0-relative in
      // Box2d, we need them to be relative to (x,y))
      let pts: number[] = [];
      for (let pt of appearance.vertices) {
        pts.push(s * pt.x + x);
        pts.push(s * pt.y + y);
      }
      // NB: must repeat start point of polygon in PIXI
      pts.push(pts[0]);
      pts.push(pts[1]);
      graphic.drawPolygon(pts);
      graphic.position.set(x, y);
      graphic.pivot.set(x, y);
      graphic.rotation = body.getRotation();
    }
    else {
      throw "Error: unrecognized FilledSprite?"
    }
    this.worldPlaneContainers[z + 2].addChild(graphic);

    // Debug render?
    if (this.debug != undefined)
      this.debugDraw(body, camera);
  }

  /**
   * Add an actor (physics+image) to the next frame
   *
   * @param appearance  The AppearanceComponent for the actor
   * @param body        The rigidBody of the actor
   * @param sprite      The sprite, from `appearance`
   * @param camera      The camera that determines which actors to show, and
   *                    where
   * @param z           The Z index of the sprite
   */
  public addBodyToFrame(appearance: AppearanceComponent, body: RigidBodyComponent, sprite: Sprite, camera: CameraSystem, z: ZIndex) {
    // If the actor isn't on screen, skip it
    if (!camera.inBounds(body.getCenter().x, body.getCenter().y, body.radius)) return;

    // Compute the dimensions of the actor, in pixels
    let s = camera.getScale();
    let x = s * (body.getCenter().x - camera.getLeft());
    let y = s * (body.getCenter().y - camera.getTop());

    // Add the sprite
    sprite.setAnchoredPosition(0.5, 0.5, x, y); // (.5, .5) == anchor at center
    sprite.sprite.width = s * appearance.width;
    sprite.sprite.height = s * appearance.height;
    sprite.sprite.rotation = body.getRotation();
    this.worldPlaneContainers[z + 2].addChild(sprite.sprite);

    // Debug render?
    if (this.debug != undefined)
      this.debugDraw(body, camera);
  }

  /**
   * Draw an outline for a rigid body
   * 
   * @param body    The rigid body whose outline we'll draw
   * @param camera  The camera related to where we're drawing
   */
  private debugDraw(body: RigidBodyComponent, camera: CameraSystem) {
    let s = camera.getScale();
    let r = body.getRotation();
    let x = s * (body.getCenter().x - camera.getLeft());
    let y = s * (body.getCenter().y - camera.getTop());
    let w = s * body.w;
    let h = s * body.h;
    if (!this.debug || !body.debug) return;
    if (body instanceof BoxBody)
      this.drawDebugBox(x, y, w, h, r, body.debug.shape, 0x00ff00);
    else if (body instanceof CircleBody)
      this.drawDebugCircle(x, y, body.radius * s, r, body.debug.shape, body.debug.line, 0x0000ff);
    else if (body instanceof PolygonBody)
      this.drawDebugPoly(x, y, r, s, body.vertArray, body.debug.shape);
  }

  /**
   * Add a Picture to the next frame.  Note that pictures are never rotated,
   * because we only use this for Parallax pictures (which have no rigid body,
   * and hence no rotation).
   *
   * @param appearance  The AppearanceComponent for the actor
   * @param sprite      The sprite, from `appearance`
   * @param camera      The camera that determines which actors to show, and
   *                    where
   * @param z           The Z index of the sprite
   */
  public addPictureToFrame(anchor: { cx: number, cy: number }, appearance: AppearanceComponent, sprite: Sprite, camera: CameraSystem, z: ZIndex) {
    // If the picture isn't on screen, skip it
    let radius = Math.sqrt(Math.pow(appearance.width / 2, 2) + Math.pow(appearance.height / 2, 2))
    if (!camera.inBounds(anchor.cx, anchor.cy, radius)) return;

    // Convert from meters to pixels
    let s = camera.getScale();
    let x = s * (anchor.cx - camera.getLeft());
    let y = s * (anchor.cy - camera.getTop());
    let w = s * appearance.width;
    let h = s * appearance.height;

    // Put it on screen
    sprite.setAnchoredPosition(0.5, 0.5, x, y); // (.5, .5) == anchor at center
    sprite.sprite.width = w;
    sprite.sprite.height = h;
    sprite.sprite.rotation = 0;
    this.worldPlaneContainers[z + 2].addChild(sprite.sprite);

    // Debug rendering: draw a box around the image
    if (this.debug)
      this.drawDebugBox(x, y, w, h, appearance.actor?.rigidBody.getRotation() ?? 0, sprite.debug, 0xff0000);
  }

  /**
   * Add text to the next frame
   *
   * @param text    The text object to display
   * @param body    The rigidBody of the actor
   * @param camera  The camera that determines which text to show, and where
   * @param center  Should we center the text at its x/y coordinate?
   * @param z           The Z index of the sprite
   */
  public addTextToFrame(text: Text, body: RigidBodyComponent, camera: CameraSystem, center: boolean, z: ZIndex) {
    if (!camera.inBounds(body.getCenter().x, body.getCenter().y, body.radius)) return;

    // Compute screen coords of center
    let s = camera.getScale();
    let x = s * (body.getCenter().x - camera.getLeft());
    let y = s * (body.getCenter().y - camera.getTop());

    // NB:  Changing the text's anchor handles top-left vs center
    text.text.anchor.set(.5, .5);
    if (!center)
      text.text.anchor.set(0, 0);

    text.text.position.x = x;
    text.text.position.y = y;
    text.text.rotation = body.getRotation();
    this.worldPlaneContainers[z + 2].addChild(text.text);

    // Draw a debug box around the text?
    if (this.debug != undefined) {
      // bounds tells us the bounding box in world coords.  For rotated text,
      // it'll be too big, so we use local bounds to get the bounding box dims.
      let bounds = text.text.getBounds();
      let lBounds = text.text.getLocalBounds();
      this.drawDebugBox(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, lBounds.width, lBounds.height, text.text.rotation, text.debug, 0xFF00FF);
    }

    // Debug render?
    if (this.debug != undefined)
      this.debugDraw(body, camera);
  }

  /**
   * Return the current Frames-Per-Second of the renderer.  This can be useful
   * when debugging
   */
  public getFPS() { return this.pixi.ticker.FPS; }

  /** TODO: in-progress support for an ASCII filter */
  private ascii_filter = new AsciiFilter(8);

  /** TODO: in-progress support for a blur filter */
  private blur_filter = new BlurFilter(.5);

  /** TODO: in-progress support for an old sepia TV filter.  Part 1: noise. */
  private noise_filter = new NoiseFilter();

  /** TODO: in-progress support for an old sepia TV filter.  Part 2: lens effect. */
  private godray_filter = new GodrayFilter();

  /** TODO: in-progress support for an old sepia TV filter.  Part 3: sepia. */
  private old_film_filter = new OldFilmFilter();

  /**
   * Apply one of our pre-made filters to the world.  All filter stuff is
   * in-progress
   *
   * TODO:  Finish adding filter support.  We probably want to do it one Z at a
   *        time?
   *
   * TODO:  Right now, we're putting the filter on Z=4.  Is that what we really
   *        want to be doing here?
   *
   * @param use_blur      Use the blur filter?
   * @param use_ascii     Use the ASCII filter?
   * @param use_sepia_tv  Use the "old TV" filter?
   */
  public applyFilter(use_blur: boolean = false, use_ascii: boolean = false, use_sepia_tv: boolean = false) {
    if (use_blur) {
      this.worldPlaneContainers[4].filters = [this.blur_filter];
    }
    else if (use_ascii) {
      this.worldPlaneContainers[4].filters = [this.ascii_filter as any];
    }
    else if (use_sepia_tv) {
      this.noise_filter.seed = Math.random();
      this.old_film_filter.sepia = .3;
      this.old_film_filter.noise = .3;
      this.old_film_filter.noiseSize = 1;
      this.old_film_filter.scratch = .5;
      this.old_film_filter.scratchDensity = .3;
      this.old_film_filter.scratchWidth = 1;
      this.old_film_filter.vignetting = .3;
      this.old_film_filter.vignettingAlpha = 1;
      this.old_film_filter.vignettingBlur = .3;
      this.worldPlaneContainers[4].filters = [this.noise_filter, this.godray_filter as any, this.old_film_filter as any];
    }
  }
}
