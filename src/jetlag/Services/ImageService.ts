// Last review: 08-10-2023

import { Assets, Graphics, Sprite as PixiSprite, Text as PixiText, Texture } from "pixi.js";
import { GameCfg } from "../Config";
import { game } from "../Stage";
import { b2Vec2 } from "@box2d/core";
import { CameraSystem } from "../Systems/Camera";

/** DebugSprite is used when we need to render a debug outline on an actor */
export class DebugSprite {
  /** The PIXI context that we use for making the shape's outline */
  readonly shape = new Graphics();

  /** A radius line when debugShape is a circle */
  readonly line = new Graphics();
}

/** A sprite is any picture that can be drawn to the screen */
export class Sprite {
  /** A debug context, for when we need to print shape outlines */
  readonly debug = new Graphics();

  /**
   * Construct a sprite
   *
   * @param imgName the name of the image file to load
   * @param sprite The PIXI sprite to use
   */
  constructor(readonly imgName: string, readonly sprite: PixiSprite) { }

  /**
   * Set the position for this sprite
   *
   * @param x The x coordinate
   * @param y The y coordinate
   */
  setPosition(x: number, y: number) {
    this.sprite.position.x = x;
    this.sprite.position.y = y;
  }

  /** Get the x coordinate of the sprite */
  getXPosition() { return this.sprite.position.x; }

  /** Get the y coordinate of the sprite */
  getYPosition() { return this.sprite.position.y; }

  /** Get the width of the sprite */
  getWidth() { return this.sprite.width; }

  /** Get the height of the sprite */
  getHeight() { return this.sprite.height; }

  /**
   * Set the width of the sprite
   *
   * @param w The new width
   */
  setWidth(w: number) { this.sprite.width = w; }

  /**
   * Set the height of the sprite
   *
   * @param h The new height
   */
  setHeight(h: number) { this.sprite.height = h; }

  /**
   * Set the rotation of the sprite
   *
   * @param r The new rotation
   */
  setRotation(r: number) { this.sprite.rotation = r; }

  /**
   * Set the position of the sprite relative to some X/Y anchor point
   *
   * @param ax The X anchor
   * @param ay The Y anchor
   * @param x The X position relative to the anchor
   * @param y The Y position relative to the anchor
   */
  setAnchoredPosition(ax: number, ay: number, x: number, y: number) {
    this.sprite.anchor.set(ax, ay);
    this.sprite.position.set(x, y);
  }
}

/** Text provides its functionality via the PIXI.text type. */
export class Text {
  /**
   * Create a Text object by wrapping a PIXI text
   *
   * @param text A PIXI text object
   */
  constructor(private text: PixiText) { }

  /** Report the X position of the text */
  getXPosition() { return this.text.position.x; }

  /** Report the Y position of the text */
  getYPosition() { return this.text.position.y; }

  /**
   * Return the width and height of the text
   *
   * @param camera      The camera of the scene where the text is being drawn
   * @param sampleText  Some text whose size we're computing, since the object's
   *                    real text might not be available yet
   */
  getDims(camera: CameraSystem, sampleText: string) {
    // NB:  When the game starts, text.text will usually be "", which gets us a
    //      valid height but not a valid width.  Swapping in sampleText gets us
    //      a better estimate.
    let t = this.text.text;
    this.text.text = sampleText;
    let res = { width: this.text.width / camera.getScale(), height: this.text.height / camera.getScale() };
    this.text.text = t;
    return res;
  }

  /**
   * Set the string to display
   *
   * @param text The string of text to display
   */
  setText(text: string) { this.text.text = text; }

  /**
   * Set the position of the text
   *
   * @param x The X coordinate of the text
   * @param y The Y coordinate of the text
   */
  setPosition(x: number, y: number) {
    this.text.position.x = x;
    this.text.position.y = y;
  }

  /** Get the width and height of this text */
  getBounds() {
    let bounds = this.text.getBounds();
    return new b2Vec2(bounds.width, bounds.height);
  }

  /** Get the part of the Text that can be passed to the renderer */
  getRenderObject() { return this.text; }
}

/**
 * ImageService provides a library of image objects that can be used at any
 * time.
 */
export class ImageService {
  /**
   * A map with all the game's textures in it.  This is slightly easier than
   * PIXI.Assets, since we don't have to deal with promises, but of course that
   * means we handle the caching ourselves.
   */
  private textures = new Map<string, Texture>;

  /**
   * Load all of the graphics assets, then call the callback to start the game
   *
   * @param callback The code to run once all assets are loaded
   */
  loadAssets(callback: () => void) {
    Assets.load(this.config.imageNames).then((textures) => {
      for (let imgName of this.config.imageNames)
        this.textures.set(imgName, textures[imgName])
      callback();
    })
  }

  /**
   * Create the service by loading all of the game's image files
   *
   * @param config The game-wide configuration
   */
  constructor(private config: GameCfg) {
    // Set the names of the graphics assets, but don't load them yet.
    for (let imgName of config.imageNames!)
      Assets.add(imgName, config.resourcePrefix + imgName);
  }

  /**
   * Get an image that has been loaded by the renderer, or a blank image if the
   * provided filename is invalid.
   *
   * @param imgName The name of the image to load
   */
  public getSprite(imgName: string) {
    let texture = this.textures.get(imgName);
    if (!texture) {
      if (imgName !== "") game.console.info("Unable to find graphics asset '" + imgName + "'");
      return new Sprite("", new PixiSprite());
    }
    // TODO: should we be cloning the texture?
    return new Sprite(imgName, new PixiSprite(texture));
  }

  /** Get a debug context that can be used by a sprite during debug renders */
  makeDebugContext() { return new DebugSprite(); }

  /**
   * Create some text
   *
   * @param txt   The text to show
   * @param opts  PIXI options for the text
   */
  public makeText(txt: string, opts: any) {
    opts.fontSize = Math.floor(opts.fontSize * game.fontScaling);
    return new Text(new PixiText(txt, opts));
  }
}