// TODO: Code Review

import { Application, Container, Graphics, BlurFilter, ColorMatrixFilter, NoiseFilter } from "pixi.js";
import { GodrayFilter, AsciiFilter, OldFilmFilter } from "pixi-filters";
import { stage } from "../Stage";
import { AppearanceComponent, } from "../Components/Appearance";
import { RigidBodyComponent, PolygonCfg } from "../Components/RigidBody";
import { CameraSystem } from "../Systems/Camera";
import { Sprite, Text } from "./ImageLibrary";
import { b2Vec2 } from "@box2d/core";

/**
 * RenderService is a wrapper around the PIXI Application object.  It
 * initializes the render loop, which fires at a regular interval to tell the
 * game to advance the simulation by some number of milliseconds.  Doing this 45
 * times per second is what makes our game work :)
 */
export class RendererService {
  /** The pixi application object is responsible for drawing onto a canvas */
  private pixi: Application;

  /**
   * mainContainer holds all of the sprites that will be rendered as part of
   * the currently in-progress render.
   */
  private main: Container;

  /**
   * debugContainer holds outlines for sprites that will be rendered during
   * the currently in-progress render, but only if we are in debug mode.
   */
  private debug?: Container;

  /** The "time" in milliseconds, where 0 is when the game started */
  private _elapsed = 0;

  /** The "time" in milliseconds, where 0 is when the game started */
  public get now() { return this._elapsed; }

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
    //
    // TODO:  `as any` avoids a warning that seems to stem from the typings
    //        being stale for PIXI 7.  Monitor for changes that will reconcile
    //        this.
    this.pixi = new Application({ width: screenWidth, height: screenHeight, antialias: true });
    document.getElementById(domId)!.appendChild(this.pixi.view as any);

    // Set up the containers we will use when rendering
    this.main = new Container();
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
      this.main.removeChildren();
      this.debug?.removeChildren();

      // Tell the game to advance by a step
      let x = this.pixi.ticker.elapsedMS;
      this._elapsed += x;
      stage.render(x);

      // Add the containers to the renderer, so they'll show on screen
      if (this.debug) this.main.addChild(this.debug);
      this.pixi.stage.addChild(this.main);
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
    poly.clear;
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
   * Helper method to add a sprite to the main container
   *
   * @param sprite  The sprite to add
   * @param x       The center X coordinate
   * @param y       The center Y coordinate
   * @param w       The sprite width
   * @param h       The sprite height
   * @param r       The rotation of the sprite
   */
  private addSprite(sprite: Sprite, x: number, y: number, w: number, h: number, r: number) {
    sprite.setAnchoredPosition(0.5, 0.5, x, y); // (.5, .5) == anchor at center
    sprite.setWidth(w);
    sprite.setHeight(h);
    sprite.setRotation(r);
    this.main.addChild(sprite.sprite);
  }

  public addGraphic(graphic: Graphics) {
    this.main.addChild(graphic);
  }

  /**
   * Add an actor (physics+image) to the next frame
   *
   * @param appearance  The AppearanceComponent for the actor
   * @param body        The rigidBody of the actor
   * @param sprite      The sprite, from `appearance`
   * @param camera      The camera that determines which actors to show, and
   *                    where
   */
  public addBodyToFrame(appearance: AppearanceComponent, body: RigidBodyComponent, sprite: Sprite, camera: CameraSystem) {
    // If the actor isn't on screen, skip it
    if (!camera.inBounds(body.getCenter().x, body.getCenter().y, body.radius)) return;

    // Compute the dimensions of the actor, in pixels
    let s = camera.getScale();
    let x = s * (body.getCenter().x - camera.getLeft());
    let y = s * (body.getCenter().y - camera.getTop());
    let w = s * appearance.props.w;
    let h = s * appearance.props.h;
    let r = body.getRotation();

    // Add the sprite
    this.addSprite(sprite, x, y, w, h, r);

    // Debug rendering: switch to the body's width/height
    w = s * body.props.w;
    h = s * body.props.h;
    if (!this.debug) return;
    if (body.isBox())
      this.drawDebugBox(x, y, w, h, r, body.debug.shape, 0x00ff00);
    else if (body.isCircle())
      this.drawDebugCircle(x, y, body.radius * s, r, body.debug.shape, body.debug.line, 0x0000ff);
    else if (body.isPolygon())
      this.drawDebugPoly(x, y, r, s, (body.props as PolygonCfg).vertArray, body.debug.shape);
  }

  /**
   * Add a Picture to the next frame
   *
   * @param appearance  The AppearanceComponent for the actor
   * @param sprite      The sprite, from `appearance`
   * @param camera      The camera that determines which actors to show, and
   *                    where
   */
  public addPictureToFrame(anchor: { cx: number, cy: number }, appearance: AppearanceComponent, sprite: Sprite, camera: CameraSystem) {
    // If the picture isn't on screen, skip it
    let radius = Math.sqrt(Math.pow(appearance.props.w / 2, 2) + Math.pow(appearance.props.h / 2, 2))
    if (!camera.inBounds(anchor.cx, anchor.cy, radius)) return;

    // Convert from meters to pixels
    let s = camera.getScale();
    let x = s * (anchor.cx - camera.getLeft());
    let y = s * (anchor.cy - camera.getTop());
    let w = s * appearance.props.w;
    let h = s * appearance.props.h;

    // Put it on screen
    this.addSprite(sprite, x, y, w, h, appearance.actor?.rigidBody.getRotation() ?? 0);

    // Debug rendering: draw a box around the image
    if (this.debug)
      this.drawDebugBox(x, y, w, h, appearance.actor?.rigidBody.getRotation() ?? 0, sprite.debug, 0xff0000);
  }

  /**
   * Add text to the next frame
   *
   * @param text    The text object to display
   * @param camera  The camera that determines which text to show, and where
   * @param center  Should we center the text at its x/y coordinate?
   */
  public addTextToFrame(text: Text, camera: CameraSystem, center: boolean) {
    // TODO: we currently don't support rotating text?
    let s = camera.getScale();
    let x = s * (text.getXPosition() - camera.getLeft());
    let y = s * (text.getYPosition() - camera.getTop());

    if (center) {
      let bounds = text.getBounds();
      x -= bounds.x / 2;
      y -= bounds.y / 2;
    }

    text.setPosition(x, y);
    this.main.addChild(text.getRenderObject());
    if (this.debug) {
      let bounds = text.getBounds();
      let w = bounds.x;
      let h = bounds.y;
      this.drawDebugBox(x + w / 2, y + h / 2, w, h, 0, new Graphics(), 0xf0f000)
    }
  }

  /**
   * Return the current Frames-Per-Second of the renderer.  This is useful
   * when debugging
   */
  public getFPS() { return this.pixi.ticker.FPS; }

  /** in-progress support for an ASCII filter */
  private ascii_filter = new AsciiFilter(8);

  /** in-progress support for a blur filter */
  private blur_filter = new BlurFilter(.5);

  /** in-progress support for an old sepia TV filter.  Part 1: noise. */
  private noise_filter = new NoiseFilter();

  /** in-progress support for an old sepia TV filter.  Part 2: lens effect. */
  private godray_filter = new GodrayFilter();

  /** in-progress support for an old sepia TV filter.  Part 3: sepia. */
  private old_film_filter = new OldFilmFilter();

  /**
   * Apply one of our pre-made filters to the world.  All filter stuff is
   * in-progress
   *
   * TODO: finish adding filter support
   *
   * @param use_blur      Use the blur filter?
   * @param use_ascii     Use the ASCII filter?
   * @param use_sepia_tv  Use the "old TV" filter?
   */
  public applyFilter(use_blur: boolean = false, use_ascii: boolean = false, use_sepia_tv: boolean = false) {
    if (use_blur) {
      this.main.filters = [this.blur_filter];
    }
    else if (use_ascii) {
      // TODO:  The 'as any' cast is due to typing issues in Pixi.js.  Keep
      //        monitoring to see if it becomes obviated by a future update to
      //        pixi's typings.
      this.main.filters = [this.ascii_filter as any];
    }
    else if (use_sepia_tv) {
      // TODO:  Is there a way to avoid re-making the ColorMatrixFilter every
      //        time?
      let f = new ColorMatrixFilter();
      f.sepia(true);
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
      // TODO:  The 'as any' casts are due to typing issues in Pixi.js.  Keep
      //        monitoring to see if they become obviated by a future update to
      //        pixi's typings.
      this.main.filters = [f, this.noise_filter, this.godray_filter as any, this.old_film_filter as any];
    }
  }
}
