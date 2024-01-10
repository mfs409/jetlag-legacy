import { initializeAndLaunch } from "../jetlag/Stage";
import { AnimationSequence, AnimationState, JetLagGameConfig } from "../jetlag/Config";
import { AnimatedSprite, FilledBox, FilledCircle, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { Path, PathMovement, ProjectileMovement, ManualMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody } from "../jetlag/Components/RigidBody";
import { Enemy, Goodie, Hero, Obstacle, Projectile, Sensor } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { DIRECTION } from "../jetlag/Components/StateManager";
import { ActorPoolSystem } from "../jetlag/Systems/ActorPool";
import { Scene } from "../jetlag/Entities/Scene";
import { boundingBox } from "./common";

/**
 * Screen dimensions and other game configuration, such as the names of all
 * the assets (images and sounds) used by this game.
 */
class Config implements JetLagGameConfig {
  pixelMeterRatio = 100;
  screenDimensions = { width: 1600, height: 900 };
  adaptToScreenSize = true;
  canVibrate = true;
  forceAccelerometerOff = true;
  storageKey = "--no-key--";
  hitBoxes = true;
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = [];
  imageNames = ["pirate.json", "lizard.json"];
}

/** State tracks all of the day-to-day stuff that our game requires */
class State {
  day = 1;                    // What day is it?
  plants = 0;                 // How many plants in the inventory
  seeds = 0;                  // How many seeds in the inventory
  lizards = 0;                // How many lizards deleted
  seed_collected = false;     // Was today's seed collected?
  dirt_states = [0, 0, 0, 0]; // State of all dirt patches (0/1/2/3) for dirt/seed/water/plant
  colors = ["#000000", "#00FF00", "#0000FF", "#FFFF00"]; // Colors for dirt patches

  /** Advance the State at the start of a new day */
  advance() {
    this.day += 1;
    this.seed_collected = false;
    for (let d = 0; d < 4; ++d) {
      if (this.dirt_states[d] == 1) this.dirt_states[d] = 0; // If you didn't water it, it died
      else if (this.dirt_states[d] == 3) this.dirt_states[d] = 0; // If you didn't harvest it, it withered
      else if (this.dirt_states[d] == 2) this.dirt_states[d] = 3; // If you watered it, it grew
    }
  }
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  // Make sure that the important session variables are configured, then get a
  // local copy
  if (!stage.storage.getSession("state")) stage.storage.setSession("state", new State());
  let state = stage.storage.getSession("state") as State;

  // Draw a box around the world
  boundingBox();

  // Make a portal to the other level
  new Actor({
    appearance: new FilledCircle({ radius: .5, fillColor: "#000000" }),
    rigidBody: new CircleBody({ cx: 4, cy: 1, radius: .5 }),
    role: new Sensor({ heroCollision: () => stage.switchTo(builder, 3 - level) })
  });

  if (level == 1) {
    // Draw a hero.  All the hard work is in configuring the animations
    let animations = new Map();
    animations.set(AnimationState.WALK_N, new AnimationSequence(true).to("pirate_walk_u_0.png", 75).to("pirate_walk_u_1.png", 75).to("pirate_walk_u_2.png", 75).to("pirate_walk_u_3.png", 75).to("pirate_walk_u_4.png", 75).to("pirate_walk_u_5.png", 75).to("pirate_walk_u_6.png", 75).to("pirate_walk_u_7.png", 75).to("pirate_walk_u_8.png", 75));
    animations.set(AnimationState.WALK_W, new AnimationSequence(true).to("pirate_walk_l_0.png", 75).to("pirate_walk_l_1.png", 75).to("pirate_walk_l_2.png", 75).to("pirate_walk_l_3.png", 75).to("pirate_walk_l_4.png", 75).to("pirate_walk_l_5.png", 75).to("pirate_walk_l_6.png", 75).to("pirate_walk_l_7.png", 75).to("pirate_walk_l_8.png", 75));
    animations.set(AnimationState.WALK_S, new AnimationSequence(true).to("pirate_walk_d_0.png", 75).to("pirate_walk_d_1.png", 75).to("pirate_walk_d_2.png", 75).to("pirate_walk_d_3.png", 75).to("pirate_walk_d_4.png", 75).to("pirate_walk_d_5.png", 75).to("pirate_walk_d_6.png", 75).to("pirate_walk_d_7.png", 75).to("pirate_walk_d_8.png", 75));
    animations.set(AnimationState.WALK_E, new AnimationSequence(true).to("pirate_walk_r_0.png", 75).to("pirate_walk_r_1.png", 75).to("pirate_walk_r_2.png", 75).to("pirate_walk_r_3.png", 75).to("pirate_walk_r_4.png", 75).to("pirate_walk_r_5.png", 75).to("pirate_walk_r_6.png", 75).to("pirate_walk_r_7.png", 75).to("pirate_walk_r_8.png", 75));

    animations.set(AnimationState.IDLE_N, new AnimationSequence(true).to("pirate_thrust_u_0.png", 750).to("pirate_thrust_u_1.png", 75));
    animations.set(AnimationState.IDLE_W, new AnimationSequence(true).to("pirate_thrust_l_0.png", 750).to("pirate_thrust_l_1.png", 75));
    animations.set(AnimationState.IDLE_S, new AnimationSequence(true).to("pirate_thrust_d_0.png", 750).to("pirate_thrust_d_1.png", 75));
    animations.set(AnimationState.IDLE_E, new AnimationSequence(true).to("pirate_thrust_r_0.png", 750).to("pirate_thrust_r_1.png", 75));

    animations.set(AnimationState.TOSS_N, new AnimationSequence(true).to("pirate_thrust_u_0.png", 75).to("pirate_thrust_u_1.png", 75).to("pirate_thrust_u_2.png", 75).to("pirate_thrust_u_3.png", 75).to("pirate_thrust_u_4.png", 75).to("pirate_thrust_u_5.png", 75).to("pirate_thrust_u_6.png", 75).to("pirate_thrust_u_7.png", 75));
    animations.set(AnimationState.TOSS_W, new AnimationSequence(true).to("pirate_thrust_l_0.png", 75).to("pirate_thrust_l_1.png", 75).to("pirate_thrust_l_2.png", 75).to("pirate_thrust_l_3.png", 75).to("pirate_thrust_l_4.png", 75).to("pirate_thrust_l_5.png", 75).to("pirate_thrust_l_6.png", 75).to("pirate_thrust_l_7.png", 75));
    animations.set(AnimationState.TOSS_S, new AnimationSequence(true).to("pirate_thrust_d_0.png", 75).to("pirate_thrust_d_1.png", 75).to("pirate_thrust_d_2.png", 75).to("pirate_thrust_d_3.png", 75).to("pirate_thrust_d_4.png", 75).to("pirate_thrust_d_5.png", 75).to("pirate_thrust_d_6.png", 75).to("pirate_thrust_d_7.png", 75));
    animations.set(AnimationState.TOSS_E, new AnimationSequence(true).to("pirate_thrust_r_0.png", 75).to("pirate_thrust_r_1.png", 75).to("pirate_thrust_r_2.png", 75).to("pirate_thrust_r_3.png", 75).to("pirate_thrust_r_4.png", 75).to("pirate_thrust_r_5.png", 75).to("pirate_thrust_r_6.png", 75).to("pirate_thrust_r_7.png", 75));

    let remap = new Map();
    remap.set(AnimationState.WALK_NW, AnimationState.WALK_W);
    remap.set(AnimationState.WALK_SW, AnimationState.WALK_W);
    remap.set(AnimationState.WALK_NE, AnimationState.WALK_E);
    remap.set(AnimationState.WALK_SE, AnimationState.WALK_E);

    remap.set(AnimationState.IDLE_NW, AnimationState.IDLE_W);
    remap.set(AnimationState.IDLE_SW, AnimationState.IDLE_W);
    remap.set(AnimationState.IDLE_NE, AnimationState.IDLE_E);
    remap.set(AnimationState.IDLE_SE, AnimationState.IDLE_E);

    remap.set(AnimationState.TOSS_NW, AnimationState.TOSS_W);
    remap.set(AnimationState.TOSS_SW, AnimationState.TOSS_W);
    remap.set(AnimationState.TOSS_NE, AnimationState.TOSS_E);
    remap.set(AnimationState.TOSS_SE, AnimationState.TOSS_E);

    remap.set(AnimationState.TOSS_IDLE_N, AnimationState.TOSS_N);
    remap.set(AnimationState.TOSS_IDLE_S, AnimationState.TOSS_S);
    remap.set(AnimationState.TOSS_IDLE_E, AnimationState.TOSS_E);
    remap.set(AnimationState.TOSS_IDLE_W, AnimationState.TOSS_W);

    remap.set(AnimationState.TOSS_IDLE_NW, AnimationState.TOSS_NW);
    remap.set(AnimationState.TOSS_IDLE_SW, AnimationState.TOSS_SW);
    remap.set(AnimationState.TOSS_IDLE_NE, AnimationState.TOSS_NE);
    remap.set(AnimationState.TOSS_IDLE_SE, AnimationState.TOSS_SE);

    const hero = new Actor({
      rigidBody: new PolygonBody({ cx: 0.5, cy: 8.1, vertices: [-.5, .9, .5, .9, .5, -.5, -.5, -.5] }, { density: 1, disableRotation: true }),
      appearance: new AnimatedSprite({ width: 2, height: 2, animations, remap }),
      role: new Hero(),
      movement: new ManualMovement(),
    });

    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(5)));

    // set up a pool of projectiles to act as "water"
    let projectiles = new ActorPoolSystem();
    for (let i = 0; i < 5; ++i) {
      let appearance = new FilledCircle({ radius: 0.125, fillColor: "#777777", z: 0 });
      let rigidBody = new CircleBody({ radius: 0.125, cx: -100, cy: -100 }, { density: 0.01 });
      rigidBody.body.SetGravityScale(1);
      rigidBody.setCollisionsEnabled(false);
      let reclaimer = (actor: Actor) => { projectiles.put(actor); actor.enabled = false; }
      let role = new Projectile({ damage: 1, disappearOnCollide: true, reclaimer });
      // Put in some code for eliminating the projectile quietly if it has
      // traveled too far
      let range = .5;
      role.prerenderTasks.push((_elapsedMs: number, actor?: Actor) => {
        if (!actor) return;
        if (!actor.enabled) return;
        let role = actor.role as Projectile;
        let body = actor.rigidBody.body;
        let dx = Math.abs(body.GetPosition().x - role.rangeFrom.x);
        let dy = Math.abs(body.GetPosition().y - role.rangeFrom.y);
        if ((dx * dx + dy * dy) > (range * range)) reclaimer(actor);
      });
      let p = new Actor({ appearance, rigidBody, movement: new ProjectileMovement(), role });
      projectiles.put(p);
    }

    // We'll water the seeds by tossing in the direction the hero is facing
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_TAB, () => {
      const V = 1; // velocity, so it's easy to adjust while developing
      let p = projectiles.get()?.role as (Projectile | undefined);
      let d = hero.state.current.direction;
      if (d == DIRECTION.W || d == DIRECTION.NW || d == DIRECTION.SW) p?.tossFrom(hero, 0, 0.3, -V, 0);
      else if (d == DIRECTION.E || d == DIRECTION.SE || d == DIRECTION.NE) p?.tossFrom(hero, 0, 0.3, V, 0);
      else if (d == DIRECTION.N) p?.tossFrom(hero, 0, 0, 0, -V);
      else if (d == DIRECTION.S) p?.tossFrom(hero, 0, 0.4, 0, V);
    });

    // Here is a seed.  We make one each day
    if (!state.seed_collected) {
      new Actor({
        rigidBody: new CircleBody({ cx: 15, cy: 8, radius: .1 }),
        appearance: new FilledCircle({ radius: .1, fillColor: "#00FF00" }),
        role: new Goodie({ onCollect: () => { state.seeds += 1; state.seed_collected = true; return true; } }),
      });
    }

    // The bed takes us to "tomorrow"
    new Actor({
      rigidBody: new BoxBody({ cx: 12, cy: 2, width: 3, height: 1.75 }),
      appearance: new FilledBox({ width: 3, height: 1.75, fillColor: "#0000FF" }),
      role: new Obstacle({
        heroCollision: () => {
          stage.requestOverlay((overlay: Scene) => {
            new Actor({
              rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
              appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
              gestures: {
                // Advance the state to take us to the next day...
                tap: () => {
                  stage.clearOverlay();
                  state.advance();
                  stage.storage.setSession("state", state);
                  stage.switchTo(builder, 1); return true;
                }
              },
            });
            new Actor({
              rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .01 }, { scene: overlay }),
              appearance: new TextSprite({ face: "Arial", size: 36, color: "#FFFFFF", center: true }, "Good Night..."),
            });
          }, false);
        }
      })
    })

    // We can plant a seed on one of the four dirt patches
    for (let d = 0; d < 4; ++d) {
      new Actor({
        rigidBody: new CircleBody({ cx: (7.5 + d), cy: 8.5, radius: .5 }),
        appearance: new FilledCircle({ radius: .5, fillColor: state.colors[state.dirt_states[d]] }),
        role: new Obstacle({
          // Planting and Collecting are via collisions
          heroCollision: (thisActor: Actor) => {
            if (state.seeds > 0 && state.dirt_states[thisActor.extra.id] == 0) {
              state.seeds -= 1;
              state.dirt_states[thisActor.extra.id] = 1;
              (thisActor.appearance[0] as FilledCircle).fillColor = state.colors[1];
            }
            else if (state.dirt_states[thisActor.extra.id] == 3) {
              state.plants += 1;
              state.dirt_states[thisActor.extra.id] = 0;
              (thisActor.appearance[0] as FilledCircle).fillColor = state.colors[0];
            }
          },
          // Watering is via a projectile
          projectileCollision: (thisActor: Actor) => {
            if (state.dirt_states[thisActor.extra.id] == 1) {
              state.dirt_states[thisActor.extra.id] = 2;
              (thisActor.appearance[0] as FilledCircle).fillColor = state.colors[2];
            }
            return false;
          }
        }),
        extra: { id: d },
      });
    }
  }

  else if (level == 2) {
    // Draw a hero.  Again, the hard work is the animations.  Notice that the
    // image is *bigger*, because of what we have in the sprite sheet.
    let animations = new Map();
    animations.set(AnimationState.WALK_N, new AnimationSequence(true).to("pirate_walk_s_u_0.png", 75).to("pirate_walk_s_u_1.png", 75).to("pirate_walk_s_u_2.png", 75).to("pirate_walk_s_u_3.png", 75).to("pirate_walk_s_u_4.png", 75).to("pirate_walk_s_u_5.png", 75).to("pirate_walk_s_u_6.png", 75).to("pirate_walk_s_u_7.png", 75).to("pirate_walk_s_u_8.png", 75));
    animations.set(AnimationState.WALK_W, new AnimationSequence(true).to("pirate_walk_s_l_0.png", 75).to("pirate_walk_s_l_1.png", 75).to("pirate_walk_s_l_2.png", 75).to("pirate_walk_s_l_3.png", 75).to("pirate_walk_s_l_4.png", 75).to("pirate_walk_s_l_5.png", 75).to("pirate_walk_s_l_6.png", 75).to("pirate_walk_s_l_7.png", 75).to("pirate_walk_s_l_8.png", 75));
    animations.set(AnimationState.WALK_S, new AnimationSequence(true).to("pirate_walk_s_d_0.png", 75).to("pirate_walk_s_d_1.png", 75).to("pirate_walk_s_d_2.png", 75).to("pirate_walk_s_d_3.png", 75).to("pirate_walk_s_d_4.png", 75).to("pirate_walk_s_d_5.png", 75).to("pirate_walk_s_d_6.png", 75).to("pirate_walk_s_d_7.png", 75).to("pirate_walk_s_d_8.png", 75));
    animations.set(AnimationState.WALK_E, new AnimationSequence(true).to("pirate_walk_s_r_0.png", 75).to("pirate_walk_s_r_1.png", 75).to("pirate_walk_s_r_2.png", 75).to("pirate_walk_s_r_3.png", 75).to("pirate_walk_s_r_4.png", 75).to("pirate_walk_s_r_5.png", 75).to("pirate_walk_s_r_6.png", 75).to("pirate_walk_s_r_7.png", 75).to("pirate_walk_s_r_8.png", 75));

    animations.set(AnimationState.IDLE_N, new AnimationSequence(true).to("pirate_slash_s_u_0.png", 750).to("pirate_slash_s_u_1.png", 75));
    animations.set(AnimationState.IDLE_W, new AnimationSequence(true).to("pirate_slash_s_l_0.png", 750).to("pirate_slash_s_l_1.png", 75));
    animations.set(AnimationState.IDLE_S, new AnimationSequence(true).to("pirate_slash_s_d_0.png", 750).to("pirate_slash_s_d_1.png", 75));
    animations.set(AnimationState.IDLE_E, new AnimationSequence(true).to("pirate_slash_s_r_0.png", 750).to("pirate_slash_s_r_1.png", 75));

    animations.set(AnimationState.TOSS_N, new AnimationSequence(true).to("pirate_slash_s_u_0.png", 50).to("pirate_slash_s_u_1.png", 50).to("pirate_slash_s_u_2.png", 50).to("pirate_slash_s_u_3.png", 50).to("pirate_slash_s_u_4.png", 50).to("pirate_slash_s_u_5.png", 50));
    animations.set(AnimationState.TOSS_W, new AnimationSequence(true).to("pirate_slash_s_l_0.png", 50).to("pirate_slash_s_l_1.png", 50).to("pirate_slash_s_l_2.png", 50).to("pirate_slash_s_l_3.png", 50).to("pirate_slash_s_l_4.png", 50).to("pirate_slash_s_l_5.png", 50));
    animations.set(AnimationState.TOSS_S, new AnimationSequence(true).to("pirate_slash_s_d_0.png", 50).to("pirate_slash_s_d_1.png", 50).to("pirate_slash_s_d_2.png", 50).to("pirate_slash_s_d_3.png", 50).to("pirate_slash_s_d_4.png", 50).to("pirate_slash_s_d_5.png", 50));
    animations.set(AnimationState.TOSS_E, new AnimationSequence(true).to("pirate_slash_s_r_0.png", 50).to("pirate_slash_s_r_1.png", 50).to("pirate_slash_s_r_2.png", 50).to("pirate_slash_s_r_3.png", 50).to("pirate_slash_s_r_4.png", 50).to("pirate_slash_s_r_5.png", 50));

    let remap = new Map();
    remap.set(AnimationState.WALK_NW, AnimationState.WALK_W);
    remap.set(AnimationState.WALK_SW, AnimationState.WALK_W);
    remap.set(AnimationState.WALK_NE, AnimationState.WALK_E);
    remap.set(AnimationState.WALK_SE, AnimationState.WALK_E);

    remap.set(AnimationState.IDLE_NW, AnimationState.IDLE_W);
    remap.set(AnimationState.IDLE_SW, AnimationState.IDLE_W);
    remap.set(AnimationState.IDLE_NE, AnimationState.IDLE_E);
    remap.set(AnimationState.IDLE_SE, AnimationState.IDLE_E);

    remap.set(AnimationState.TOSS_NW, AnimationState.TOSS_W);
    remap.set(AnimationState.TOSS_SW, AnimationState.TOSS_W);
    remap.set(AnimationState.TOSS_NE, AnimationState.TOSS_E);
    remap.set(AnimationState.TOSS_SE, AnimationState.TOSS_E);

    remap.set(AnimationState.TOSS_IDLE_N, AnimationState.TOSS_N);
    remap.set(AnimationState.TOSS_IDLE_S, AnimationState.TOSS_S);
    remap.set(AnimationState.TOSS_IDLE_E, AnimationState.TOSS_E);
    remap.set(AnimationState.TOSS_IDLE_W, AnimationState.TOSS_W);

    remap.set(AnimationState.TOSS_IDLE_NW, AnimationState.TOSS_NW);
    remap.set(AnimationState.TOSS_IDLE_SW, AnimationState.TOSS_SW);
    remap.set(AnimationState.TOSS_IDLE_NE, AnimationState.TOSS_NE);
    remap.set(AnimationState.TOSS_IDLE_SE, AnimationState.TOSS_SE);

    const hero = new Actor({
      rigidBody: new PolygonBody({ cx: 0.5, cy: 8.1, vertices: [-.5, .9, .5, .9, .5, -.5, -.5, -.5] }, { density: 1, disableRotation: true }),
      appearance: new AnimatedSprite({ width: 4, height: 4, animations, remap }),
      role: new Hero(),
      movement: new ManualMovement(),
    });

    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(5)));

    // set up a pool with one projectile, which we will use to simulate punching
    //
    // NB:  We use a pool so that it's easy to prevent "multi-punch"
    let projectiles = new ActorPoolSystem();
    let appearance = new FilledCircle({ radius: .5, fillColor: "#00000000", z: 0 });
    let rigidBody = new CircleBody({ radius: .5, cx: -100, cy: -100 }, { density: 0.01 });
    rigidBody.body.SetGravityScale(1);
    rigidBody.setCollisionsEnabled(false);
    let reclaimer = (actor: Actor) => { projectiles.put(actor); actor.enabled = false; }
    let role = new Projectile({ damage: 1, disappearOnCollide: false, reclaimer, });
    projectiles.put(new Actor({ appearance, rigidBody, movement: new ProjectileMovement(), role }));

    // "Punch" in the direction the hero is facing
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_TAB, () => {
      let p = projectiles.get()?.role as (Projectile | undefined);
      let d = hero.state.current.direction;
      if (d == DIRECTION.W) p?.punch(-.7, 0, hero, .5);
      else if (d == DIRECTION.NW) p?.punch(-.7, -.6, hero, .5);
      else if (d == DIRECTION.SW) p?.punch(-.7, .9, hero, .5);
      else if (d == DIRECTION.E) p?.punch(.7, 0, hero, .5);
      else if (d == DIRECTION.NE) p?.punch(.7, -.6, hero, .5);
      else if (d == DIRECTION.SE) p?.punch(.7, .9, hero, .5);
      else if (d == DIRECTION.N) p?.punch(0, -.6, hero, .5);
      else if (d == DIRECTION.S) p?.punch(0, .9, hero, .5);
    });

    // Make an enemy
    animations = new Map();
    animations.set(AnimationState.WALK_W, new AnimationSequence(true)
      .to("lizard_walk_l_0.png", 75).to("lizard_walk_l_1.png", 75)
      .to("lizard_walk_l_2.png", 75).to("lizard_walk_l_3.png", 75)
      .to("lizard_walk_l_4.png", 75).to("lizard_walk_l_5.png", 75)
      .to("lizard_walk_l_6.png", 75).to("lizard_walk_l_7.png", 75)
      .to("lizard_walk_l_8.png", 75));

    animations.set(AnimationState.WALK_E, new AnimationSequence(true)
      .to("lizard_walk_r_0.png", 75).to("lizard_walk_r_1.png", 75)
      .to("lizard_walk_r_2.png", 75).to("lizard_walk_r_3.png", 75)
      .to("lizard_walk_r_4.png", 75).to("lizard_walk_r_5.png", 75)
      .to("lizard_walk_r_6.png", 75).to("lizard_walk_r_7.png", 75)
      .to("lizard_walk_r_8.png", 75));
    remap = new Map();
    remap.set(AnimationState.IDLE_E, AnimationState.WALK_E);
    // Enemy to defeat
    new Actor({
      appearance: new AnimatedSprite({ width: 2, height: 2, animations, remap }),
      rigidBody: new PolygonBody({ cx: 14.5, cy: 8.1, vertices: [-.5, .9, .5, .9, .5, -.5, -.5, -.5] }, { density: 1, disableRotation: true }),
      movement: new PathMovement(new Path().to(14.5, 8.1).to(18.5, 8.1).to(14.5, 8.1), 2.5, true),
      role: new Enemy({ damage: 1, onDefeated: () => { state.lizards += 1; stage.storage.setSession("state", state); } })
    });

    stage.score.onLose = { level, builder };
    stage.score.onWin = { level, builder };
  }

  // Put the day on the hud
  new Actor({
    rigidBody: new CircleBody({ cx: .125, cy: .25, radius: .001 }, { scene: stage.hud }),
    appearance: new TextSprite({ face: "Arial", size: 36, color: "#000000", center: false }, () => "Day: " + state.day),
  });

  // Put the seed inventory on the hud
  new Actor({
    rigidBody: new CircleBody({ cx: .5, cy: .75, radius: .001 }, { scene: stage.hud }),
    appearance: new TextSprite({ face: "Arial", size: 36, color: "#000000", center: false }, () => "x " + state.seeds),
  });
  new Actor({
    rigidBody: new CircleBody({ cx: .25, cy: 1, radius: .1 }, { scene: stage.hud }),
    appearance: new FilledCircle({ radius: .1, fillColor: "#00FF00" }),
  });

  // Put the number of harvested plants on the hud
  new Actor({
    rigidBody: new CircleBody({ cx: .5, cy: 1.25, radius: .001 }, { scene: stage.hud }),
    appearance: new TextSprite({ face: "Arial", size: 36, color: "#000000", center: false }, () => "x " + state.plants),
  });
  new Actor({
    rigidBody: new CircleBody({ cx: .25, cy: 1.5, radius: .1 }, { scene: stage.hud }),
    appearance: new FilledCircle({ radius: .1, fillColor: "#FFFF00" }),
  });

  // Put the number of defeated lizards on the hud
  new Actor({
    rigidBody: new CircleBody({ cx: .5, cy: 1.75, radius: .001 }, { scene: stage.hud }),
    appearance: new TextSprite({ face: "Arial", size: 36, color: "#000000", center: false }, () => "x " + state.lizards),
  });
  new Actor({
    rigidBody: new CircleBody({ cx: .25, cy: 1.875, radius: .1 }, { scene: stage.hud }),
    appearance: new ImageSprite({ width: .5, height: .5, img: "lizard_walk_r_0.png" }),
  });
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
