import { JetLagApi as JetLagApi } from "../api/JetLagApi"

/**
 * Verbosity levels, for controlling how much output is printed to the console
 * during game play
 */
export enum JetLagVerbosity { SILENT = 0, QUIET = 1, LOUD = 2 }

/**
 * Config stores game-specific configuration values.
 *
 * To create a game, programmers should create an instance of this object,
 * set all of its fields, and pass it to runGameAsHtml
 */
export class JetLagConfig {
  /** How many pixels are equivalent to a meter in the game? */
  public pixelMeterRatio = -1;

  /** 
   * Amount by which fonts need to be scaled to make everything fit on the
   * screen.  This is used internally by JetLag... you should leave it as 1.
   */
  public fontScaling = 1;

  /** The default game screen width, in pixels */
  public screenWidth = -1;

  /** The default game screen height, in pixels */
  public screenHeight = -1;

  /** Should we adapt the game size based on the size of the browser window? */
  public adaptToScreenSize = false;

  /** Should the phone vibrate on certain events? */
  public canVibrate = true;

  /** How verbose should we be with printing to the console (0-2, 0 == none) */
  public verbosity = JetLagVerbosity.LOUD;

  /** Should JetLag print an outline around each actor in the game? */
  public debugMode = true;

  /** Total number of levels. This helps the transition when a level is won */
  public numLevels = -1;

  /** Should the level chooser be activated? */
  public enableChooser = true;

  /** Key for accessing persistent storage */
  public storageKey: string = null;

  /** The list of image files that can be used by the game */
  public imageNames: string[] = null;

  /** The list of audio files that can be used as sound effects by the game */
  public soundNames: string[] = null;

  /** The list of audio files that can be used as (looping) background music */
  public musicNames: string[] = null;

  /** The prefix for all resources */
  public resourcePrefix = "";

  /** Should we force the accelerometer to be off? */
  public forceAccelerometerOff = false;

  /** Should we force the game to run in mobile mode? */
  public mobileMode = false;

  /** The code that draws the main levels of the game */
  public levelBuilder: (index: number, jl: JetLagApi) => void = null;

  /** The code that draws the level chooser */
  public chooserBuilder: (index: number, jl: JetLagApi) => void = null;

  /** The code that draws the help screens */
  public helpBuilder: (index: number, jl: JetLagApi) => void = null;

  /** The code that draws the opening "splash" screen */
  public splashBuilder: (index: number, jl: JetLagApi) => void = null;

  /** The code that draws the store screens */
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
    if (this.verbosity < 0 || this.verbosity > 2) {
      errs.push("Invalid loglevel in game config object");
      this.verbosity = 2; // let's show a lot of errors in this case :)
    }
    if (this.pixelMeterRatio <= 0)
      errs.push("Invalid pixelMeterRatio in game config object");
    if (this.screenWidth <= 0)
      errs.push("width must be greater than zero in game config object");
    if (this.screenHeight <= 0)
      errs.push("height must be greater than zero in game config object");
    if (this.numLevels <= 0)
      errs.push("Invalid numLevels in game config object");
    if (this.storageKey === null)
      errs.push("Invalid storageKey in game config object");
    if (this.imageNames === null)
      errs.push("Invalid imageNames in game config object");
    if (this.soundNames === null)
      errs.push("Invalid soundNames in game config object");
    if (this.musicNames === null)
      errs.push("Invalid musicNames in game config object");
    if (this.resourcePrefix === null)
      errs.push("Invalid value for resourcePrefix in game config object");
    if (this.levelBuilder === null)
      errs.push("Invalid levelBuilder in game config object");
    if (this.chooserBuilder === null)
      errs.push("Invalid chooserBuilder in game config object");
    if (this.helpBuilder === null)
      errs.push("Invalid helpBuilder in game config object");
    if (this.splashBuilder === null)
      errs.push("Invalid splashBuilder in game config object");
    if (this.storeBuilder === null)
      errs.push("Invalid storeBuilder in game config object");
    return errs;
  }
}