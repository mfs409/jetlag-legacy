import { b2Vec2 } from "@box2d/core";
import { stage } from "../Stage";
import { CameraSystem } from "../Systems/Camera";
import { AnimatedSprite, ImageSprite, ZIndex } from "../Components/Appearance";

/**
 * A ParallaxLayer is a layer that seems to scroll and repeat.  Layering
 * several, with different scroll speeds, gives a sense of depth to the
 * background.
 */
class ParallaxLayer {
  /** The images to display */
  private images: (ImageSprite | AnimatedSprite)[] = [];

  /** coordinates of last render */
  private last = new b2Vec2(0, 0);

  /** Last camera position */
  private lastCam = new b2Vec2(0, 0);

  /**
   * Construct a ParallaxLayer that can be rendered correctly
   *
   * @param anchor        A reference point for where one tile of the
   *                      defaultImage will be placed.
   * @param imageMaker  An ImageSprite or AnimatedSprite that will be cloned
   *                      in order to produce enough images to achieve a good
   *                      scrolling effect.
   * @param speed         Speed at which it scrolls.  Important values are 0, 1,
   *                      and between.  Differs for auto and non-auto.
   * @param isHorizontal  True for X scrolling, false for Y scrolling
   * @param isAuto        True if this should scroll regardless of the camera
   */
  constructor(anchor: { cx: number, cy: number }, imageMaker: () => (ImageSprite | AnimatedSprite), private speed: number, private isHorizontal: boolean, private isAuto: boolean) {
    let firstImage = imageMaker();
    this.images.push(firstImage);
    this.last.Set(anchor.cx - firstImage.width / 2, anchor.cy - firstImage.height / 2);
    // figure out how many sprites we need to properly tile the image
    let num = 1;
    if (this.isHorizontal) {
      let screenWidthMeters = stage.screenWidth / stage.pixelMeterRatio;
      num += Math.ceil(screenWidthMeters / firstImage.width);
    } else {
      let screenHeightMeters = stage.screenHeight / stage.pixelMeterRatio;
      num += Math.ceil(screenHeightMeters / firstImage.height);
    }
    for (let i = 1; i < num; ++i)
      this.images.push(imageMaker());
  }

  /**
   * Render a layer
   *
   * @param camera    The camera for the world that these layers accompany
   * @param elapsedMs The time since the last render
   * @param z         The z index at which to render the layer
   */
  public render(camera: CameraSystem, elapsedMs: number, z: ZIndex) {
    for (let i of this.images)
      i.prerender(elapsedMs);
    if (this.isAuto) this.renderAuto(camera, elapsedMs, z);
    else this.renderRelative(camera, elapsedMs, z);
  }

  /**
   * Draw a layer that moves in a fixed velocity in the X dimension
   *
   * @param camera    The camera for the world that these layers accompany
   * @param elapsedMs The elapsed time since we last drew this layer
   * @param z         The z index at which to render the layer
   */
  private renderAuto(camera: CameraSystem, elapsedMs: number, z: ZIndex) {
    // Determine the position of a reference tile of the image
    if (this.isHorizontal) this.last.x += this.speed * elapsedMs;
    else this.last.y += this.speed * elapsedMs;
    this.normalizeAndRender(camera, elapsedMs, z);
  }

  /**
   * Draw a layer that moves in relation to the camera center point
   *
   * NB: the efficiency of this code derives from the assumption that the
   *     camera does not move suddenly
   *
   * @param camera    The camera for the world that these layers accompany
   * @param elapsedMs The elapsed time since we last drew this layer
   * @param z         The z index at which to render the layer
   */
  private renderRelative(camera: CameraSystem, elapsedMs: number, z: ZIndex) {
    // Determine the change in camera
    let x = camera.getLeft(); // left of viewport
    let y = camera.getTop(); // top of viewport
    let dx = x - this.lastCam.x;
    let dy = y - this.lastCam.y;
    // Determine the relative change to the reference tile
    if (this.isHorizontal) this.last.x = this.last.x + dx * this.speed;
    else this.last.y = this.last.y + dy * this.speed;
    this.normalizeAndRender(camera, elapsedMs, z);
  }

  /**
   * This is how we actually figure out where to draw the background
   *
   * @param camera  The camera for the world that these layers accompany
   * @param z       The z index at which to render the layer
   */
  private normalizeAndRender(camera: CameraSystem, elapsedMs: number, z: ZIndex) {
    let x = camera.getLeft(); // left of viewport
    let y = camera.getTop(); // top of viewport
    let camW = stage.screenWidth / stage.pixelMeterRatio;
    let camH = stage.screenHeight / stage.pixelMeterRatio;
    // Normalize the reference tile
    // TODO: Do this without a while loop
    if (this.isHorizontal) {
      let w = this.images[0].width;
      while (this.last.x > x + camW) this.last.x -= w;
      while (this.last.x + w < x) this.last.x += w;
      while (this.last.x > x) this.last.x -= w;
    } else {
      let h = this.images[0].height;
      while (this.last.y > y + camH) this.last.y -= h;
      while (this.last.y + h < y) this.last.y += h;
      while (this.last.y > y) this.last.y -= h;
    }
    // save camera for next render
    this.lastCam.x = x;
    this.lastCam.y = y;
    this.renderVisibleTiles(camera, elapsedMs, z);
  }

  /**
   * Given the x,y coordinates of a reference tile, render the tiles of a
   * layer that are visible
   *
   * @param camera    The camera for the world that these layers accompany
   * @param elapsedMs The elapsed time since we last drew this layer
   * @param z         The z index at which to render the layer
   */
  private renderVisibleTiles(camera: CameraSystem, elapsedMs: number, z: ZIndex) {
    let x = camera.getLeft(); // left of viewport
    let y = camera.getTop(); // top of viewport
    let camW = stage.screenWidth / stage.pixelMeterRatio;
    let camH = stage.screenHeight / stage.pixelMeterRatio;
    if (this.isHorizontal) {
      let i = 0;
      let plx = this.last.x;
      while (plx < x + camW) {
        let cx = plx + this.images[i].width / 2;
        let cy = this.last.y + this.images[i].height / 2;
        this.images[i].renderWithoutBody({ cx, cy }, camera, elapsedMs, z);
        plx += this.images[i].width;
        i++;
      }
    }
    else {
      let i = 0;
      let ply = this.last.y;
      while (ply < y + camH) {
        let cx = this.last.x + this.images[i].width / 2;
        let cy = ply + this.images[i].height / 2;;
        this.images[i].renderWithoutBody({ cx, cy }, camera, elapsedMs, z);
        ply += this.images[i].height;
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
 * - negative means "moves too fast"
 */
export class ParallaxSystem {
  /** All the layers to show */
  private layers: ParallaxLayer[] = [];

  /**
   * Add a parallax layer to the current level
   *
   * @param cfg.anchor        The position of one instance of the image.  All
   *                          other instances will be tiled from this point.
   * @param cfg.imageMaker    Code for making each ImageSprite or AnimatedSprite
   * @param cfg.speed         Speed that the picture seems to move.
   * @param cfg.isHorizontal  True for moving in X, false for moving in Y
   * @param cfg.isAuto        Should the image scroll automatically, or in
   *                          relation to the camera position?
   */
  public addLayer(cfg: { anchor: { cx: number, cy: number }, imageMaker: () => (ImageSprite | AnimatedSprite), speed: number, isHorizontal?: boolean, isAuto?: boolean }) {
    this.layers.push(new ParallaxLayer(cfg.anchor, cfg.imageMaker, cfg.speed, cfg.isHorizontal == undefined ? true : !!cfg.isHorizontal, !!cfg.isAuto));
  }

  /**
   * Render all of the layers of this parallax scene
   *
   * @param camera    The camera for the world that these layers accompany
   * @param elapsedMs The time since the last render
   * @param z         The z index at which to render the layer
   */
  public render(camera: CameraSystem, elapsedMs: number, z: ZIndex) {
    for (let pl of this.layers)
      pl.render(camera, elapsedMs, z);
  }
}
