import { BaseActor as BaseActor } from "../actor/Base";
import { Camera } from "./Camera";
import { XY } from "./XY";
import { JetLagManager } from "../JetLagManager";

/**
 * JetLagDevice abstracts away the differences between different device types
 * (true HTML browser, Cordova), so that the rest of JetLag can be completely
 * device-agnostic.
 */
export interface JetLagDevice {
    getTouchScreen(): JetLagTouchScreen;
    getKeyboard(): JetLagKeyboard;
    getAccelerometer(): JetLagAccelerometer;
    getRenderer(): JetLagRenderer;
    getVibration(): JetLagVibration;
    getSpeaker(): JetLagSpeaker;
    getStorage(): JetLagStorage;
    getProcess(): JetLagProcess;
    getConsole(): JetLagConsole;
}

/**
 * TouchScreen provides a way of getting gestures from the device and routing
 * them to the current stage
 */
export interface JetLagTouchScreen {
    setTouchReceiverHolder(holder: JetLagTouchReceiverHolder): void;
}

/**
 * Keyboard provides a way of getting keystrokes and routing them to the current
 * stage
 */
export interface JetLagKeyboard {
    setKeyDownHandler(key: JetLagKeys, handler: () => void): void;
    setKeyUpHandler(key: JetLagKeys, handler: () => void): void;
}

/**
 * Accelerometer provides a way of getting accelerometer input and routing it to
 * the current stage
 */
export interface JetLagAccelerometer {
    get(): XY;
    setX(x: number): void;
    setY(y: number): void;
    getSupported(): boolean;
}

/** Renderer abstracts away differences between rendering engines */
export interface JetLagRenderer {
    addActorToFrame(actor: BaseActor, camera: Camera): void;
    setFrameColor(color: number): void;
    loadAssets(callback: () => void): void;
    addPictureToFrame(sprite: JetLagSprite, camera: Camera): void;
    startRenderLoop(manager: JetLagManager): void;
    initFrame(): void;
    showFrame(): void;
    addTextToFrame(text: JetLagText, camera: Camera, center: boolean): void;
    getSprite(imgName: string): JetLagSprite;
    getFPS(): number;
    makeText(txt: string, opts: any): JetLagText;
    makeDebugContext(): JetLagDebugSprite;
}

/** Vibration provides an abstract interface for vibrating the device */
export interface JetLagVibration {
    vibrate(millis: number): void;
}

/** Speaker is a representation of the device's audio context */
export interface JetLagSpeaker {
    getSound(soundName: string): JetLagSound;
    getMusic(musicName: string): JetLagSound;
    resetMusicVolume(volume: number): void;
}

/** An abstract representation of three key/value stores */
export interface JetLagStorage {
    clearLevelFacts(): void;
    setLevel(key: string, value: any): void;
    getLevel(key: string, defaultVal: any): string;
    setSession(key: string, value: any): void;
    getSession(key: string, defaultVal: any): string;
    setPersistent(key: string, value: string): void;
    getPersistent(key: string, defaultVal: string): string;
}

/** A representation of the top-level game process */
export interface JetLagProcess { exit(): void; }

/** A representation of the device console */
export interface JetLagConsole {
    urgent(msg: string): void;
    info(msg: string): void;
}

/**
 * TouchReceiver provides handlers to run in response to all of the gestures
 * that we care about.
 */
export interface JetLagTouchReceiver {
    tap(screenX: number, screenY: number): void;
    panStart(screenX: number, screenY: number): void;
    panMove(screenX: number, screenY: number): void;
    panStop(screenX: number, screenY: number): void;
    touchDown(screenX: number, screenY: number): void;
    touchUp(screenX: number, screenY: number): void;
    swipe(x0: number, y0: number, x1: number, y1: number, time: number): void;
}

/**
 * The TouchScreen portion of the device receives gestures from the screen,
 * and needs to route them to a TouchReceiver.  In JetLag, the Stage is the
 * appropriate thing to receive screen gestures, but it changes each time we
 * change levels or jump between modes.  It would be cumbersome to update
 * the device every time we change stages, so instead the TouchScreen embeds
 * a level of indirection in its API: rather than provide the device with a
 * TouchReceiver, we give it a TouchReceiverHolder.  The TouchReceiverHolder
 * can swap out TouchReceivers at any time, and route new gestures to the
 * new TouchReceiver, and everything works fine.
 */
export interface JetLagTouchReceiverHolder {
    getTouchReceiver(): JetLagTouchReceiver;
}

/**
 * We are probably going to need a way to re-interpret the meaning of
 * accelerometer values depending on the orientation of the device (at least
 * portrait vs. landscape).  Until we have a use case, we'll just anticipate as
 * best we can by having this enum to pass to the constructor.
 */
export enum JetLagAccelerometerMode {
    DEFAULT_LANDSCAPE,
}

/**
 * The keys that we care about in the keyboard
 */
export enum JetLagKeys {
    ESCAPE = 0, UP = 1, DOWN = 2, LEFT = 3, RIGHT = 4, SPACE = 5, COUNT = 6
}

export interface JetLagSound {
    play(): void;
    stop(): void;
}

export interface JetLagText {
    setPosition(x: number, y: number): void;
    getXPosition(): number;
    getYPosition(): number;
    getBounds(): XY;
    setText(text: string): void;
    getRenderObject(): any;
}

export interface JetLagSprite {
    getImgName(): string;
    setPosition(x: number, y: number): void;
    getXPosition(): number;
    getYPosition(): number;
    getWidth(): number;
    setWidth(w: number): void;
    getHeight(): number;
    setHeight(h: number): void;
    setRotation(r: number): void;
    setAnchoredPosition(ax: number, ay: number, x: number, y: number): void;
    getRenderObject(): any;
    getDebugShape(): any;
}

export interface JetLagDebugSprite {
    getShape(): any;
    getLine(): any;
}


/**
 * Renderable encapsulates anything that can be drawn on the screen.  In JetLag,
 * there are three ways that we might draw to the screen:
 * - Actor: has a physics body; uses that body to determine an image's x/y/theta
 * - Text: no physics body; must have an x/y/theta on its own
 * - Picture: no physics body; must have an x/y/theta on its own
 */
export interface Renderable {
    /**
     * Render something to the screen.  If the object needs to be updated before
     * rendering, do it here, too.  If the object should be culled (not rendered
     * because it isn't in view), that should be decided here too.
     */
    render(renderer: JetLagRenderer, camera: Camera, elapsedMillis: number): void;
}