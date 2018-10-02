/**
 * The keys that we care about in the keyboard
 */
export enum KEYS {
    ESCAPE = 0, UP = 1, DOWN = 2, LEFT = 3, RIGHT = 4, SPACE = 5, COUNT = 6
}

/**
 * Keyboard abstracts the ways of responding to keyboard events
 */
export class JetLagKeyboard {
    /** handlers for when keys are pressed down */
    downHandlers: (() => void)[] = [];

    /** handlers for when keys are released */
    upHandlers: (() => void)[] = [];

    /** Set a handler to respond to some keydown event */
    public setKeyDownHandler(key: KEYS, handler: () => void) { this.downHandlers[key.valueOf() as number] = handler; }

    /** Set a handler to respond to some keyup event */
    public setKeyUpHandler(key: KEYS, handler: () => void) { this.upHandlers[key.valueOf() as number] = handler; }

    /**
     * Convert a key code to KEYS enum
     */
    private toCode(code: number): number {
        let idx = -1;
        switch (code) {
            case 27: idx = KEYS.ESCAPE; break;
            case 38: idx = KEYS.UP; break;
            case 40: idx = KEYS.DOWN; break;
            case 37: idx = KEYS.LEFT; break;
            case 39: idx = KEYS.RIGHT; break;
            case 32: idx = KEYS.SPACE; break;
            default: idx = -1; break;
        }
        return idx;
    }

    /**
     * Respond to a key down event
     */
    private keyDownHandler(ev: KeyboardEvent) {
        let idx = this.toCode(ev.keyCode);
        if (idx != -1) {
            let h = this.downHandlers[idx];
            if (h !== null) {
                h();
                ev.preventDefault();
            }
        }
    }

    /**
     * Respond to a key up event
     */
    private keyUpHandler(ev: KeyboardEvent) {
        let idx = this.toCode(ev.keyCode);
        if (idx != -1) {
            let h = this.upHandlers[idx];
            if (h !== null) {
                h();
                ev.preventDefault();
            }
        }
    }

    /** 
     * Build the Keyboard handler object
     */
    constructor() {
        for (let o = 0; o < KEYS.COUNT; ++o) {
            this.upHandlers.push(null);
            this.downHandlers.push(null);
        }
        document.addEventListener("keydown", (ev: KeyboardEvent) => this.keyDownHandler(ev));
        document.addEventListener("keyup", (ev: KeyboardEvent) => this.keyUpHandler(ev));
    }
}