import { Scene } from "../Entities/Scene";
import { Stage } from "../Stage";
import Hammer from "hammerjs";

// TODO: Review this file

/** GestureService routes gesture events (as defined by hammerjs) to a Stage. */
export class GestureService {
  /** The DOM element that receives gesture events */
  private elt: HTMLElement;

  /** Should gestures go to the HUD first, or to the WORLD first? */
  public gestureHudFirst = true;

  /**
   * Create the service by providing the name of an HTML element (typically
   * a DIV) that should begin receiving gestures.
   *
   * @param domId The Id of the DOM element that will receive gesture events
   * @param stage The stage that should receive the events
   */
  constructor(domId: string, stage: Stage) {
    let tmp = document.getElementById(domId);
    if (tmp === null) throw `Element ${domId} cannot be found`;
    this.elt = tmp;

    // Since we are using gestures, turn off left clicking of the whole page
    this.elt.oncontextmenu = function (this: HTMLElement, _ev: PointerEvent) {
      return false;
    } as any;

    // Set up handlers for all the Hammer events
    let hammer = new Hammer(this.elt);
    hammer.on("tap", (ev: HammerInput) => {
      let e = ev.srcEvent as PointerEvent;
      // Log the event?
      if (stage.config.hitBoxes) {
        let world_coords = stage.world.camera.screenToMeters(e.offsetX, e.offsetY);
        let hud_coords = stage.hud.camera.screenToMeters(e.offsetX, e.offsetY);
        stage.console.log("World Touch: (" + world_coords.x + ", " + world_coords.y + ")");
        stage.console.log("HUD Touch: (" + hud_coords.x + ", " + hud_coords.y + ")");
      }
      // If we have an overlay scene right now, let it handle the tap
      if (stage.overlay) {
        this.tap(stage.overlay, e.offsetX, e.offsetY);
        return;
      }
      // Handle in hud or world
      if (this.gestureHudFirst) {
        if (this.tap(stage.hud, e.offsetX, e.offsetY)) return;
        this.tap(stage.world, e.offsetX, e.offsetY);
      } else {
        if (this.tap(stage.world, e.offsetX, e.offsetY)) return;
        this.tap(stage.hud, e.offsetX, e.offsetY);
      }
    });

    hammer.get("pan").set({ direction: Hammer.DIRECTION_ALL });
    hammer.on("panstart", (ev: HammerInput) => {
      let e = ev.srcEvent as PointerEvent;
      if (stage.overlay) {
        this.panStart(stage.overlay, e.offsetX, e.offsetY);
        return;
      }
      this.panStart(stage.hud, e.offsetX, e.offsetY);
    });
    hammer.on("panmove", (ev: HammerInput) => {
      let e = ev.srcEvent as PointerEvent;
      if (stage.overlay) {
        this.panMove(stage.overlay, e.offsetX, e.offsetY);
        return;
      }
      this.panMove(stage.hud, e.offsetX, e.offsetY);
    });
    hammer.on("panend", (ev: HammerInput) => {
      let e = ev.srcEvent as PointerEvent;
      if (stage.overlay) this.panStop(stage.overlay, e.offsetX, e.offsetY);
      else this.panStop(stage.hud, e.offsetX, e.offsetY);
    });
    hammer.on("pancancel", (ev: HammerInput) => {
      let e = ev.srcEvent as PointerEvent;
      if (stage.overlay) this.panStop(stage.overlay, e.offsetX, e.offsetY);
      else this.panStop(stage.hud, e.offsetX, e.offsetY);
    });

    // this gets us 'downpress' and 'release'.  See "input events" on
    // http://hammerjs.github.io/api/
    hammer.on("hammer.input", (ev: HammerInput) => {
      if (ev.eventType == 1) {
        let e = ev.srcEvent as PointerEvent;
        if (stage.overlay) this.touchDown(stage.overlay, e.offsetX, e.offsetY);
        else this.touchDown(stage.hud, e.offsetX, e.offsetY);
      } else if (ev.eventType == 4) {
        let e = ev.srcEvent as PointerEvent;
        if (stage.overlay) this.touchUp(stage.overlay, e.offsetX, e.offsetY);
        else this.touchUp(stage.hud, e.offsetX, e.offsetY);
      }
    });

    // NB: swipe also registers pans.
    // NB: there is also swipeup, swipeleft, swiperight, swipedown
    hammer.on("swipe", (ev: HammerInput) => {
      this.swipe(stage.hud, ev.center.x - ev.deltaX, ev.center.y - ev.deltaY, ev.center.x, ev.center.y, ev.deltaTime);
    });
    hammer.get("swipe").set({ direction: Hammer.DIRECTION_ALL });
  }

  /** Reset the gesture system to its default state */
  public reset() { this.gestureHudFirst = true; }

  /**
   * Handle a tap action
   *
   * @param scene    The scene that should receive the gesture
   * @param screenX  The X coordinate on the screen
   * @param screenY  The Y coordinate on the screen
   */
  private tap(scene: Scene, screenX: number, screenY: number) {
    for (let actor of scene.physics!.actorsAt(scene.camera, screenX, screenY))
      if (actor.gestures?.tap)
        if (actor.gestures.tap(scene.camera.screenToMeters(screenX, screenY)))
          return true;
    return false;
  }

  /**
   * Run this when a pan event starts
   *
   * @param scene    The scene that should receive the gesture
   * @param screenX  The X coordinate on the screen
   * @param screenY  The Y coordinate on the screen
   */
  private panStart(scene: Scene, screenX: number, screenY: number) {
    for (let actor of scene.physics!.actorsAt(scene.camera, screenX, screenY))
      if (actor?.gestures?.panStart)
        if (actor.gestures.panStart(scene.camera.screenToMeters(screenX, screenY)))
          return true;
    return false;
  }

  /**
   * This runs when a pan produces a "move" event
   *
   * @param scene    The scene that should receive the gesture
   * @param screenX  The X coordinate on the screen
   * @param screenY  The Y coordinate on the screen
   */
  private panMove(scene: Scene, screenX: number, screenY: number) {
    for (let actor of scene.physics!.actorsAt(scene.camera, screenX, screenY))
      if (actor?.gestures?.panMove)
        if (actor.gestures.panMove(scene.camera.screenToMeters(screenX, screenY)))
          return true;
    return false;
  }

  /**
   * This runs when a pan event stops
   *
   * @param scene    The scene that should receive the gesture
   * @param screenX  The X coordinate on the screen
   * @param screenY  The Y coordinate on the screen
   */
  private panStop(scene: Scene, screenX: number, screenY: number) {
    for (let actor of scene.physics!.actorsAt(scene.camera, screenX, screenY))
      if (actor?.gestures?.panStop)
        if (actor.gestures.panStop(scene.camera.screenToMeters(screenX, screenY)))
          return true;
    return false;
  }

  /**
   * This runs in response to a down-press
   *
   * @param scene    The scene that should receive the gesture
   * @param screenX  The X coordinate on the screen
   * @param screenY  The Y coordinate on the screen
   */
  private touchDown(scene: Scene, screenX: number, screenY: number) {
    for (let actor of scene.physics!.actorsAt(scene.camera, screenX, screenY))
      if (actor?.gestures?.touchDown)
        if (actor.gestures.touchDown(scene.camera.screenToMeters(screenX, screenY)))
          return true;
    return false;
  }

  /**
   * This runs when a down-press is released
   *
   * @param scene    The scene that should receive the gesture
   * @param screenX  The X coordinate on the screen
   * @param screenY  The Y coordinate on the screen
   */
  private touchUp(scene: Scene, screenX: number, screenY: number) {
    for (let actor of scene.physics!.actorsAt(scene.camera, screenX, screenY))
      if (actor?.gestures?.touchUp)
        if (actor.gestures.touchUp(scene.camera.screenToMeters(screenX, screenY)))
          return true;
    return false;
  }

  /**
   * This runs in response to a screen swipe event
   *
   * @param scene    The scene that should receive the gesture
   * @param screenX0 The x of the start position of the swipe
   * @param screenY0 The y of the start position of the swipe
   * @param screenX1 The x of the end position of the swipe
   * @param screenY1 The y of the end position of the swipe
   * @param time     The time it took for the swipe to happen
   */
  private swipe(scene: Scene, screenX0: number, screenY0: number, screenX1: number, screenY1: number, time: number) {
    for (let sActor of scene.physics!.actorsAt(scene.camera, screenX0, screenY0)) {
      for (let eActor of scene.physics!.actorsAt(scene.camera, screenX1, screenY1)) {
        if (sActor === eActor) {
          if (sActor.gestures?.swipe)
            if (sActor.gestures.swipe(scene.camera.screenToMeters(screenX0, screenY0), scene.camera.screenToMeters(screenX1, screenY1), time))
              return true;
        }
      }
    }
    return false;
  }
}
