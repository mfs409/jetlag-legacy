/**
 * The keys that we currently support.  We represent each with its `ev.code`
 * value.
 */
export enum KeyCodes {
  KEY_ESCAPE = 'Escape', KEY_HOME = 'Home', KEY_END = 'End',
  KEY_INSERT = 'Insert', KEY_DELETE = 'Delete', KEY_BACKQUOTE = 'Backquote',
  KEY_DIGIT1 = 'Digit1', KEY_DIGIT2 = 'Digit2', KEY_DIGIT3 = 'Digit3',
  KEY_DIGIT4 = 'Digit4', KEY_DIGIT5 = 'Digit5', KEY_DIGIT6 = 'Digit6',
  KEY_DIGIT7 = 'Digit7', KEY_DIGIT8 = 'Digit8', KEY_DIGIT9 = 'Digit9',
  KEY_DIGIT0 = 'Digit0', KEY_MINUS = 'Minus', KEY_EQUAL = 'Equal',
  KEY_BACKSPACE = 'Backspace', KEY_TAB = 'Tab',
  KEY_Q = 'KeyQ', KEY_W = 'KeyW', KEY_E = 'KeyE', KEY_R = 'KeyR', KEY_T = 'KeyT',
  KEY_Y = 'KeyY', KEY_U = 'KeyU', KEY_I = 'KeyI', KEY_O = 'KeyO', KEY_P = 'KeyP',
  KEY_BRACKETLEFT = 'BracketLeft', KEY_BRACKETRIGHT = 'BracketRight',
  KEY_BACKSLASH = 'Backslash',
  KEY_A = 'KeyA', KEY_S = 'KeyS', KEY_D = 'KeyD', KEY_F = 'KeyF', KEY_G = 'KeyG',
  KEY_H = 'KeyH', KEY_J = 'KeyJ', KEY_K = 'KeyK', KEY_L = 'KeyL',
  KEY_SEMICOLON = 'Semicolon',
  KEY_QUOTE = 'Quote', KEY_ENTER = 'Enter',
  KEY_Z = 'KeyZ', KEY_X = 'KeyX', KEY_C = 'KeyC', KEY_V = 'KeyV', KEY_B = 'KeyB',
  KEY_N = 'KeyN', KEY_M = 'KeyM', KEY_COMMA = 'Comma', KEY_PERIOD = 'Period',
  KEY_SLASH = 'Slash', KEY_SPACE = 'Space', KEY_PAGEUP = 'PageUp', KEY_PAGEDOWN = 'PageDown',
  KEY_LEFT = 'ArrowLeft', KEY_UP = 'ArrowUp', KEY_DOWN = 'ArrowDown', KEY_RIGHT = 'ArrowRight',
};

/**
 * KeyboardService provides an interface for subscribing to keyboard events and
 * running callbacks when those events happen.
 */
export class KeyboardService {
  /** 
   * handlers for when keys are down pressed.  These re-fire while the key is
   * held 
   */
  private downHandlers: Map<string, () => void> = new Map();

  /** handlers for when keys are released */
  private upHandlers: Map<string, () => void> = new Map();

  /** Create the service by setting up listeners */
  constructor() {
    // NB:  `ev.preventDefault()` is necessary, or things like TAB will do their
    //      default UI interaction (e.g., focus the address bar)
    document.addEventListener("keydown", (ev: KeyboardEvent) => { ev.preventDefault(); this.keyDownHandler(ev) }, true);
    document.addEventListener("keyup", (ev: KeyboardEvent) => { ev.preventDefault(); this.keyUpHandler(ev) });
  }

  /**
   * Set a handler to respond to some keydown event
   *
   * @param key     The key to listen for
   * @param handler The code to run
   */
  public setKeyDownHandler(key: KeyCodes, handler: () => void) { this.downHandlers.set(key.valueOf(), handler); }

  /**
   * Set a handler to respond to some keyup event
   *
   * @param key     The key to listen for
   * @param handler The code to run
   */
  public setKeyUpHandler(key: KeyCodes, handler: () => void) { this.upHandlers.set(key.valueOf(), handler); }

  /** Reset the keyboard (e.g., between levels) */
  public clearHandlers() {
    this.downHandlers.clear();
    this.upHandlers.clear();
  }

  /**
   * Respond to a key down event
   *
   * @param ev The HTML keyboard Event
   */
  private keyDownHandler(ev: KeyboardEvent) {
    let handler = this.downHandlers.get(ev.code);
    if (handler)
      handler();
  }

  /**
   * Respond to a key up event
   *
   * @param ev The HTML keyboard Event
   */
  private keyUpHandler(ev: KeyboardEvent) {
    let handler = this.upHandlers.get(ev.code);
    if (handler)
      handler();
  }
}
