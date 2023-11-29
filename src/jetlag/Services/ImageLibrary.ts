import { Assets, Graphics, Sprite as PixiSprite, Text as PixiText, Texture } from "pixi.js";
import { GameConfig } from "../Config";
import { stage } from "../Stage";

/** DebugSprite is used when we need to render a debug outline on an actor */
export class DebugSprite {
  /** The PIXI context that we use for making the shape's outline */
  readonly shape = new Graphics();

  /** A radial line when debugShape is a circle */
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

/** Text is for anything that we render by using a string and a font */
export class Text {
  /** A debug context, for when we need to print the text's outline */
  readonly debug = new Graphics();

  /**
   * Create a Text object by wrapping a PIXI text
   *
   * @param text A PIXI text object
   */
  private constructor(readonly text: PixiText) { }

  /**
   * Create some text, with the font size scaled according to the stage's
   * current scale.
   *
   * @param txt   The text to show
   * @param opts  PIXI options for the text
   */
  public static makeText(txt: string, opts: any) {
    opts.fontSize = Math.floor(opts.fontSize * stage.fontScaling);
    return new Text(new PixiText(txt, opts));
  }
}

/**
 * ImageService provides a library of image objects that can be used at any
 * time.
 */
export class ImageLibraryService {
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
  constructor(private config: GameConfig) {
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
      if (imgName !== "") stage.console.log("Unable to find graphics asset '" + imgName + "'");
      return new Sprite("", new PixiSprite());
    }
    // NB:  If we wanted to use Pixi to modify the texture, then we'd need to
    //      clone it first.
    return new Sprite(imgName, new PixiSprite(texture));
  }
}
