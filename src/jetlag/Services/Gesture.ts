import { Scene } from "../Entities/Scene";
import { Stage } from "../Stage";
import Hammer from "hammerjs";

/*** GestureService routes gesture events (as defined by hammerjs) to a Stage */
export class GestureService {
  /**
   * The DOM element that receives gesture events
   *
   * NB:  hammerjs needs this, but since we always have a game with a single div
   *      that fills the screen, it's kind of trivial.
   */
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

    let mouseFunc = (ev: MouseEvent) => {
      let overlay_coords = stage.overlay?.camera.screenToMeters(ev.clientX, ev.clientY);
      let world_coords = stage.world.camera.screenToMeters(ev.clientX, ev.clientY);
      let hud_coords = stage.hud.camera.screenToMeters(ev.clientX, ev.clientY);
      // If we have an overlay scene right now, let it handle the tap
      if (stage.overlay) {
        this.mouseHover(stage.overlay, overlay_coords!);
      }
      // Handle in hud or world
      else if (this.gestureHudFirst) {
        if (this.mouseHover(stage.hud, hud_coords)) return;
        this.mouseHover(stage.world, world_coords);
      } else {
        if (this.mouseHover(stage.world, world_coords)) return;
        this.mouseHover(stage.hud, hud_coords);
      }
    }

    this.elt.onmouseover = (ev: MouseEvent) => { mouseFunc(ev); };
    this.elt.onmousemove = (ev: MouseEvent) => { mouseFunc(ev); };

    // Set up handlers for all the Hammer events
    let hammer = new Hammer(this.elt);
    hammer.on("tap", (ev: HammerInput) => {
      let e = ev.srcEvent as PointerEvent;
      let overlay_coords = stage.overlay?.camera.screenToMeters(e.offsetX, e.offsetY);
      let world_coords = stage.world.camera.screenToMeters(e.offsetX, e.offsetY);
      let hud_coords = stage.hud.camera.screenToMeters(e.offsetX, e.offsetY);
      // Log the coordinates, to aid in debugging?
      if (stage.config.hitBoxes) {
        stage.console.log("World Touch: (" + world_coords.x + ", " + world_coords.y + ")");
        stage.console.log("HUD Touch: (" + hud_coords.x + ", " + hud_coords.y + ")");
      }
      // If we have an overlay scene right now, let it handle the tap
      if (stage.overlay) {
        this.tap(stage.overlay, overlay_coords!);
      }
      // Handle in hud or world
      else if (this.gestureHudFirst) {
        if (this.tap(stage.hud, hud_coords)) return;
        this.tap(stage.world, world_coords);
      } else {
        if (this.tap(stage.world, world_coords)) return;
        this.tap(stage.hud, hud_coords);
      }
    });

    hammer.get("pan").set({ direction: Hammer.DIRECTION_ALL });
    hammer.on("panstart", (ev: HammerInput) => {
      let e = ev.srcEvent as PointerEvent;
      let overlay_coords = stage.overlay?.camera.screenToMeters(e.offsetX, e.offsetY);
      let hud_coords = stage.hud.camera.screenToMeters(e.offsetX, e.offsetY);
      if (stage.overlay) this.panStart(stage.overlay, overlay_coords!);
      else this.panStart(stage.hud, hud_coords);
    });
    hammer.on("panmove", (ev: HammerInput) => {
      let e = ev.srcEvent as PointerEvent;
      let overlay_coords = stage.overlay?.camera.screenToMeters(e.offsetX, e.offsetY);
      let hud_coords = stage.hud.camera.screenToMeters(e.offsetX, e.offsetY);
      if (stage.overlay) this.panMove(stage.overlay, overlay_coords!);
      else this.panMove(stage.hud, hud_coords);
    });
    hammer.on("panend", (ev: HammerInput) => {
      let e = ev.srcEvent as PointerEvent;
      let overlay_coords = stage.overlay?.camera.screenToMeters(e.offsetX, e.offsetY);
      let hud_coords = stage.hud.camera.screenToMeters(e.offsetX, e.offsetY);
      if (stage.overlay) this.panStop(stage.overlay, overlay_coords!);
      else this.panStop(stage.hud, hud_coords);
    });
    hammer.on("pancancel", (ev: HammerInput) => {
      let e = ev.srcEvent as PointerEvent;
      let overlay_coords = stage.overlay?.camera.screenToMeters(e.offsetX, e.offsetY);
      let hud_coords = stage.hud.camera.screenToMeters(e.offsetX, e.offsetY);
      if (stage.overlay) this.panStop(stage.overlay, overlay_coords!);
      else this.panStop(stage.hud, hud_coords);
    });

    // this gets us 'downpress' and 'release'.  See "input events" on
    // http://hammerjs.github.io/api/
    hammer.on("hammer.input", (ev: HammerInput) => {
      let e = ev.srcEvent as PointerEvent;
      let overlay_coords = stage.overlay?.camera.screenToMeters(e.offsetX, e.offsetY);
      let hud_coords = stage.hud.camera.screenToMeters(e.offsetX, e.offsetY);
      if (ev.eventType == 1) {
        if (stage.overlay) this.touchDown(stage.overlay, overlay_coords!);
        else this.touchDown(stage.hud, hud_coords);
      } else if (ev.eventType == 4) {
        if (stage.overlay) this.touchUp(stage.overlay, overlay_coords!);
        else this.touchUp(stage.hud, hud_coords);
      }
    });

    // NB:  swipe also registers pans, so you probably don't want swipe and pan
    //      at the same time.
    //
    // NB:  This could be split into swipeup, swipeleft, swiperight, swipedown,
    //      but that's probably not worth it.
    hammer.on("swipe", (ev: HammerInput) => {
      let start_coord = stage.hud.camera.screenToMeters(ev.center.x - ev.deltaX, ev.center.y - ev.deltaY);
      let end_coord = stage.hud.camera.screenToMeters(ev.center.x, ev.center.y);
      this.swipe(stage.hud, start_coord, end_coord, ev.deltaTime);
    });
    hammer.get("swipe").set({ direction: Hammer.DIRECTION_ALL });
  }

  /** Reset the gesture system to its default state */
  public reset() { this.gestureHudFirst = true; }

  /**
   * Handle a tap action
   *
   * @param scene   The scene that should receive the gesture
   * @param coords  The coordinates (within the scene) of the gesture
   */
  private tap(scene: Scene, coords: { x: number, y: number }) {
    for (let actor of scene.physics!.actorsAt(coords))
      if (actor.gestures?.tap)
        if (actor.gestures.tap(coords))
          return true;
    return false;
  }

  /**
   * Handle a mouse over or mouse move action
   *
   * @param scene   The scene that should receive the gesture
   * @param coords  The coordinates (within the scene) of the gesture
   */
  private mouseHover(scene: Scene, coords: { x: number, y: number }) {
    for (let actor of scene.physics!.actorsAt(coords))
      if (actor.gestures?.mouseHover)
        if (actor.gestures.mouseHover(coords))
          return true;
    return false;
  }

  /**
   * Run this when a pan event starts
   *
   * @param scene   The scene that should receive the gesture
   * @param coords  The coordinates (within the scene) of the gesture
   */
  private panStart(scene: Scene, coords: { x: number, y: number }) {
    for (let actor of scene.physics!.actorsAt(coords))
      if (actor?.gestures?.panStart)
        if (actor.gestures.panStart(coords))
          return true;
    return false;
  }

  /**
   * This runs when a pan produces a "move" event
   *
   * @param scene   The scene that should receive the gesture
   * @param coords  The coordinates (within the scene) of the gesture
   */
  private panMove(scene: Scene, coords: { x: number, y: number }) {
    for (let actor of scene.physics!.actorsAt(coords))
      if (actor?.gestures?.panMove)
        if (actor.gestures.panMove(coords))
          return true;
    return false;
  }

  /**
   * This runs when a pan event stops
   *
   * @param scene   The scene that should receive the gesture
   * @param coords  The coordinates (within the scene) of the gesture
   */
  private panStop(scene: Scene, coords: { x: number, y: number }) {
    for (let actor of scene.physics!.actorsAt(coords))
      if (actor?.gestures?.panStop)
        if (actor.gestures.panStop(coords))
          return true;
    return false;
  }

  /**
   * This runs in response to a down-press
   *
   * @param scene   The scene that should receive the gesture
   * @param coords  The coordinates (within the scene) of the gesture
   */
  private touchDown(scene: Scene, coords: { x: number, y: number }) {
    for (let actor of scene.physics!.actorsAt(coords))
      if (actor?.gestures?.touchDown)
        if (actor.gestures.touchDown(coords))
          return true;
    return false;
  }

  /**
   * This runs when a down-press is released
   *
   * @param scene   The scene that should receive the gesture
   * @param coords  The coordinates (within the scene) of the gesture
   */
  private touchUp(scene: Scene, coords: { x: number, y: number }) {
    for (let actor of scene.physics!.actorsAt(coords))
      if (actor?.gestures?.touchUp)
        if (actor.gestures.touchUp(coords))
          return true;
    return false;
  }

  /**
   * This runs in response to a screen swipe event
   *
   * @param scene         The scene that should receive the gesture
   * @param start_coords  The coordinates (within the scene) where the swipe
   *                      began
   * @param end_coords    The coordinates (within the scene) where the swipe
   *                      ended
   * @param time          The time it took for the swipe to happen
   */
  private swipe(scene: Scene, start_coord: { x: number, y: number }, end_coord: { x: number, y: number }, time: number) {
    for (let sActor of scene.physics!.actorsAt(start_coord))
      if (sActor.gestures?.swipe)
        for (let eActor of scene.physics!.actorsAt(end_coord))
          if (sActor === eActor)
            if (sActor.gestures.swipe(start_coord, end_coord, time))
              return true;
    return false;
  }
}
