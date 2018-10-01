import { JetLagApi } from "./api/JetLagApi"

/**
 * Config stores game-specific configuration values.
 *
 * To create a game, programmers should create an instance of this object and
 * set all of its fields.
 */
export class JetLagConfig {
  /** The number of pixels on screen that correspond to a meter in the game */
  public pixelMeterRatio: number = -1;

  /** The default game width, in pixels */
  public screenWidth: number = -1;

  /** The default game height, in pixels */
  public screenHeight: number = -1;

  /** Should we adapt the game size based on the size of the browser window? */
  public adaptToScreenSize: boolean = false;

  /** Should the phone vibrate on certain events? */
  public canVibrate: boolean = null;

  /** How verbose should we be with printing to the console (0-2, 0 == none) */
  public logLevel: number = 2;

  /**
   * When this is true, the game will show an outline corresponding to the 
   * physics body behind each Actor in the game
   */
  public debugMode: boolean = null;

  /** Total number of levels. This helps the transition when a level is won */
  public numLevels: number = -1;

  /** Should the level chooser be activated? */
  public enableChooser: boolean = null;

  /** Key for accessing persistent storage */
  public storageKey: string = null;

  /** The default font face to use when writing text to the screen */
  public defaultFontFace: string = null;

  /** Default font size to use when writing text to the screen */
  public defaultFontSize: number = -1;

  /** Default font color.  This should be a #RRGGBB value */
  public defaultFontColor: string = null;

  /** The list of image files that will be used by the game */
  public imageNames: string[] = null;

  /** The list of audio files that will be used as sound effects by the game */
  public soundNames: string[] = null;

  /** The prefix for all resources */
  public resourcePrefix = "";

  /** SHould we force the accelerometer to be off? */
  public forceAccelerometerOff = false;

  /**
   * The list of audio files that will be used as (looping) background music by
   * the game
   */
  public musicNames: string[] = null;

  /** An object to draw the main levels of the game */
  public levelBuilder: (index: number, jl: JetLagApi) => void = null;

  /** An object to draw the level chooser */
  public chooserBuilder: (index: number, jl: JetLagApi) => void = null;

  /** An object to draw the help screens */
  public helpBuilder: (index: number, jl: JetLagApi) => void = null;

  /** An object to draw the opening "splash" screen */
  public splashBuilder: (index: number, jl: JetLagApi) => void = null;

  /** An object to draw the store screens */
  public storeBuilder: (index: number, jl: JetLagApi) => void = null;

  /** Construct a Config object with default (invalid) settings */
  constructor() { }

  /**
   * Verify that the Config object has legal values for all fields
   * 
   * @returns [] if the object is valid, and an array of error messages 
   *          otherwise
   */
  public check(): string[] {
    let errs: string[] = [];
    if (this.pixelMeterRatio === -1)
      errs.push("Invalid pixelMeterRatio in game config object");
    if (this.screenWidth <= 0)
      errs.push("width must be greater than zero in game config object");
    if (this.screenHeight <= 0)
      errs.push("mHeight must be greater than zero in game config object");
    if (this.canVibrate === null)
      errs.push("Invalid mEnableVibration value in game config object");
    if (this.debugMode === null)
      errs.push("Invalid mShowDebugBoxes in game config object");
    if (this.numLevels === -1)
      errs.push("Invalid mNumLevels in game config object");
    if (this.enableChooser === null)
      errs.push("Invalid mEnableChooser in game config object");
    if (this.storageKey === null)
      errs.push("Invalid mStorageKey in game config object");
    if (this.defaultFontFace === null)
      errs.push("Invalid mDefaultFontFace in game config object");
    if (this.defaultFontSize === -1)
      errs.push("Invalid mDefaultFontSize in game config object");
    if (this.defaultFontColor === null)
      errs.push("Invalid mDefaultFontColor in game config object");
    if (this.imageNames === null)
      errs.push("Invalid mImageNames in game config object");
    if (this.soundNames === null)
      errs.push("Invalid mSoundNames in game config object");
    if (this.musicNames === null)
      errs.push("Invalid mMusicNames in game config object");
    if (this.levelBuilder === null)
      errs.push("Invalid mLevels in game config object");
    if (this.chooserBuilder === null)
      errs.push("Invalid mChooser in game config object");
    if (this.helpBuilder === null)
      errs.push("Invalid mHelp in game config object");
    if (this.splashBuilder === null)
      errs.push("Invalid mSplash in game config object");
    if (this.storeBuilder === null)
      errs.push("Invalid mStore in game config object");
    return errs;
  }
}