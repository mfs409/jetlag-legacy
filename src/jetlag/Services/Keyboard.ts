// Last review: 08-10-2023

/**
 * The keys that we currently support
 *
 * TODO: consider adding WASD?  Others?
 */
export enum KeyCodes { ESCAPE = 0, UP = 1, DOWN = 2, LEFT = 3, RIGHT = 4, SPACE = 5, COUNT = 6 }

/**
 * KeyboardService provides an interface for subscribing to keyboard events and
 * running callbacks when those events happen.
 */
export class KeyboardService {
  /** handlers for when keys are pressed down */
  private downHandlers: (() => void)[] = [];

  /** handlers for when keys are released */
  private upHandlers: (() => void)[] = [];

  /** Create the service by setting up listeners */
  constructor() {
    document.addEventListener("keydown", (ev: KeyboardEvent) => this.keyDownHandler(ev));
    document.addEventListener("keyup", (ev: KeyboardEvent) => this.keyUpHandler(ev));
  }

  /**
   * Set a handler to respond to some keydown event
   *
   * @param key     The key to listen for
   * @param handler The code to run
   */
  public setKeyDownHandler(key: KeyCodes, handler: () => void) { this.downHandlers[key.valueOf() as number] = handler; }

  /**
   * Set a handler to respond to some keyup event
   *
   * @param key     The key to listen for
   * @param handler The code to run
   */
  public setKeyUpHandler(key: KeyCodes, handler: () => void) { this.upHandlers[key.valueOf() as number] = handler; }

  /** Reset the keyboard (i.e., between levels) */
  public clearHandlers() {
    this.downHandlers = [];
    this.upHandlers = [];
  }

  /** Convert a key code to the KEYS enum */
  private toCode(code: number): number {
    let idx = -1;
    switch (code) {
      case 27: idx = KeyCodes.ESCAPE; break;
      case 38: idx = KeyCodes.UP; break;
      case 40: idx = KeyCodes.DOWN; break;
      case 37: idx = KeyCodes.LEFT; break;
      case 39: idx = KeyCodes.RIGHT; break;
      case 32: idx = KeyCodes.SPACE; break;
      default: idx = -1; break;
    }
    return idx;
  }

  /**
   * Respond to a key down event
   *
   * @param ev The HTML keyboard Event
   */
  private keyDownHandler(ev: KeyboardEvent) {
    // TODO:  address deprecated field
    let idx = this.toCode(ev.keyCode);
    if (idx != -1) {
      let h = this.downHandlers[idx];
      if (h) {
        h();
        ev.preventDefault();
      }
    }
  }

  /**
   * Respond to a key up event
   *
   * @param ev The HTML keyboard Event
   */
  private keyUpHandler(ev: KeyboardEvent) {
    // TODO:  address deprecated field
    let idx = this.toCode(ev.keyCode);
    if (idx != -1) {
      let h = this.upHandlers[idx];
      if (h) {
        h();
        ev.preventDefault();
      }
    }
  }
}