// Last review: 08-11-2023

import { b2Vec2 } from "@box2d/core";
import { game } from "../Stage";
import { CameraSystem } from "../Systems/Camera";
import { AppearanceComponent } from "../Components/Appearance";

/**
 * A ParallaxLayer is a layer that seems to scroll and repeat at a velocity that
 * gives a sense of depth.
 */
class ParallaxLayer {
  /** The images to display */
  private images: AppearanceComponent[] = [];

  /** coords of last render */
  private last = new b2Vec2(0, 0);

  /** Last camera position */
  private lastCam = new b2Vec2(0, 0);

  /**
   * Construct a ParallaxLayer that can be rendered correctly
   *
   * @param cfgOpts       The configuration options for this layer
   * @param speed         Speed at which it scrolls.  Important values are 0, 1,
   *                      and between.  Differs for auto and non-auto.
   * @param isHorizontal  True for X scrolling, false for Y scrolling
   * @param isAuto        True if this should scroll regardless of camera
   */
  constructor(anchor: { cx: number, cy: number }, defaultImage: AppearanceComponent, private speed: number, private isHorizontal: boolean, private isAuto: boolean) {
    this.last.Set(anchor.cx - defaultImage.props.w / 2, anchor.cy - defaultImage.props.h / 2);
    // figure out how many sprites we need to properly tile the image
    let num = 1;
    if (this.isHorizontal) {
      let screenWidthMeters = game.screenWidth / game.pixelMeterRatio;
      num += Math.ceil(screenWidthMeters / defaultImage.props.w);
    } else {
      let screenHeightMeters = game.screenHeight / game.pixelMeterRatio;
      num += Math.ceil(screenHeightMeters / defaultImage.props.h);
    }
    for (let i = 0; i < num; ++i)
      this.images.push(defaultImage.clone());
  }

  /**
   * Render a layer
   *
   * @param camera    The camera for the world that these layers accompany
   * @param elapsedMs The time since the last render
   */
  public render(camera: CameraSystem, elapsedMs: number) {
    for (let i of this.images)
      i.prerender(elapsedMs);
    if (this.isAuto) this.renderAuto(camera, elapsedMs);
    else this.renderRelative(camera, elapsedMs);
  }

  /**
   * Draw a layer that moves in a fixed velocity in the X dimension
   *
   * @param camera  The camera for the world that these layers accompany
   * @param elapsed The elapsed time since we last drew this layer
   */
  private renderAuto(camera: CameraSystem, elapsedMs: number) {
    // Determine the position of a reference tile of the image
    if (this.isHorizontal) this.last.x += this.speed * elapsedMs;
    else this.last.y += this.speed * elapsedMs;
    this.normalizeAndRender(camera, elapsedMs);
  }

  /**
   * This is how we actually figure out where to draw the background
   *
   * @param camera  The camera for the world that these layers accompany
   */
  private normalizeAndRender(camera: CameraSystem, elapsedMs: number) {
    let x = camera.getOffsetX(); // left of viewport
    let y = camera.getOffsetY(); // top of viewport
    let camW = game.screenWidth / game.pixelMeterRatio;
    let camH = game.screenHeight / game.pixelMeterRatio;
    // Normalize the reference tile
    // TODO: surely some O(1) algebra would work here?
    if (this.isHorizontal) {
      let w = this.images[0].props.w;
      while (this.last.x > x + camW) this.last.x -= w;
      while (this.last.x + w < x) this.last.x += w;
      while (this.last.x > x) this.last.x -= w;
    } else {
      let h = this.images[0].props.h;
      while (this.last.y > y + camH) this.last.y -= h;
      while (this.last.y + h < y) this.last.y += h;
      while (this.last.y > y) this.last.y -= h;
    }
    // save camera for next render
    this.lastCam.x = x;
    this.lastCam.y = y;
    this.renderVisibleTiles(camera, elapsedMs);
  }

  /**
   * Draw a layer that moves in relation to the camera center point
   *
   * NB: the efficiency of this code derives from the assumption that the
   *     camera does not move suddenly
   *
   * @param camera  The camera for the world that these layers accompany
   */
  private renderRelative(camera: CameraSystem, elapsedMs: number) {
    // Determine the change in camera
    let x = camera.getOffsetX(); // left of viewport
    let y = camera.getOffsetY(); // top of viewport
    let dx = x - this.lastCam.x;
    let dy = y - this.lastCam.y;
    // Determine the relative change to the reference tile
    if (this.isHorizontal) this.last.x = this.last.x + dx * this.speed;
    else this.last.y = this.last.y + dy * this.speed;
    this.normalizeAndRender(camera, elapsedMs);
  }

  /**
   * Given the x,y coordinates of a reference tile, render the tiles of a
   * layer that are visible
   *
   * @param camera  The camera for the world that these layers accompany
   */
  private renderVisibleTiles(camera: CameraSystem, elapsedMs: number) {
    let x = camera.getOffsetX(); // left of viewport
    let y = camera.getOffsetY(); // top of viewport
    let camW = game.screenWidth / game.pixelMeterRatio;
    let camH = game.screenHeight / game.pixelMeterRatio;
    if (this.isHorizontal) {
      let i = 0;
      let plx = this.last.x;
      while (plx < x + camW) {
        let cx = plx + this.images[i].props.w / 2;
        let cy = this.last.y + this.images[i].props.h / 2;
        this.images[i].renderAt({ cx, cy }, camera, elapsedMs);
        plx += this.images[i].props.w;
        i++;
      }
    }
    else {
      let i = 0;
      let ply = this.last.y;
      while (ply < y + camH) {
        let cx = this.last.x + this.images[i].props.w / 2;
        let cy = ply + this.images[i].props.h / 2;;
        this.images[i].renderAt({ cx, cy }, camera, elapsedMs);
        ply += this.images[i].props.h;
        i++;
      }
    }
  }
}

/**
 * ParallaxSystems present a set of images that seem to scroll relative to the
 * position of the actor on whom the camera is centered.
 *
 * The speeds of layers are a very important concept.
 * - 1 means "moves at same speed as hero", which means "fixed position"
 * - 0 means "doesn't move", which means "looks like a tiled background"
 * - in-between should be interesting
 */
export class ParallaxSystem {
  /** All the layers to show */
  private layers: ParallaxLayer[] = [];

  /**
   * Add a parallax layer to the current level
   *
   * @param appearance    An AppearanceComponent, describing the appearance of
   *                      the layer
   * @param speed         Speed that the picture seems to move.
   * @param isHorizontal  True for moving in X, false for moving in Y
   * @param isAuto        Should the image scroll automatically, or in relation
   *                      to the camera position?
   */
  public addLayer(anchor: { cx: number, cy: number }, cfg: { appearance: AppearanceComponent, speed: number, isHorizontal?: boolean, isAuto?: boolean }) {
    this.layers.push(new ParallaxLayer(anchor, cfg.appearance, cfg.speed, cfg.isHorizontal == undefined ? true : !!cfg.isHorizontal, !!cfg.isAuto));
  }

  /**
   * Render all of the layers of this parallax scene
   *
   * @param camera    The camera for the world that these layers accompany
   * @param elapsedMs The time since the last render
   */
  public render(camera: CameraSystem, elapsedMs: number) {
    for (let pl of this.layers)
      pl.render(camera, elapsedMs);
  }
}
