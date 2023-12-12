import { initializeAndLaunch } from "../jetlag/Stage";
import { AnimationSequence, AnimationState, JetLagGameConfig } from "../jetlag/Config";
import { AnimatedSprite, AppearanceComponent, FilledBox, FilledCircle, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { Path, PathMovement, ProjectileMovement, StandardMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody, RigidBodyComponent } from "../jetlag/Components/RigidBody";
import { Enemy, Goodie, Hero, Obstacle, Projectile, Sensor } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { SoundEffectComponent } from "../jetlag/Components/SoundEffect";
import { DIRECTION } from "../jetlag/Components/StateManager";
import { ActorPoolSystem } from "../jetlag/Systems/ActorPool";
import { Scene } from "../jetlag/Entities/Scene";

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
  imageNames = ["pirate.json", "noise.png", "lizard.json"];
}

/**
 * Build the levels of the game.  In this game, level 1 is farming, and level 2
 * is fighting.
 *
 * @param level Which level should be displayed
 */
function game(level: number) {
  if (level == 1) {
    if (!stage.storage.getSession("day"))
      stage.storage.setSession("day", 1);

    // TODO: Advancement of the day is all messed up

    // Draw some walls, but make the screen pretty big
    Actor.Make({
      appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 16, cy: -.05, width: 32, height: .1 }),
      role: new Obstacle(),
    });
    Actor.Make({
      appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 16, cy: 18.05, width: 32, height: .1 }),
      role: new Obstacle(),
    });
    Actor.Make({
      appearance: new FilledBox({ width: .1, height: 18, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: -.05, cy: 9, width: .1, height: 18 }),
      role: new Obstacle(),
    });
    Actor.Make({
      appearance: new FilledBox({ width: .1, height: 18, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 32.05, cy: 9, width: .1, height: 18 }),
      role: new Obstacle(),
    });
    Actor.Make({
      appearance: new ImageSprite({ width: 32, height: 18, img: "noise.png", z: -2 }),
      rigidBody: new BoxBody({ cx: 16, cy: 9, width: 32, height: 18 })
    })

    // A portal to the other level
    Actor.Make({
      appearance: new FilledCircle({ radius: .5, fillColor: "#000000" }),
      rigidBody: new CircleBody({ cx: 1, cy: 1, radius: .5 }),
      role: new Sensor(() => stage.switchTo(game, 2))
    });

    // Draw a hero.  Note that the animations are pretty tricky
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

    const hero = Actor.Make({
      rigidBody: new PolygonBody({ cx: 0.5, cy: 8.1, vertices: [-.5, .9, .5, .9, .5, -.5, -.5, -.5] }, stage.world, { density: 1, disableRotation: true }),
      appearance: new AnimatedSprite({ width: 2, height: 2, animations, remap }),
      role: new Hero(),
      movement: new StandardMovement(),
    });
    stage.world.camera.setCameraFocus(hero);
    stage.world.camera.setBounds(0, 0, 32, 18);

    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => ((hero.movement as StandardMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as StandardMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as StandardMovement).updateXVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as StandardMovement).updateXVelocity(0)));

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as StandardMovement).updateYVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as StandardMovement).updateYVelocity(5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as StandardMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as StandardMovement).updateXVelocity(5)));

    // set up a pool of projectiles, but now once the projectiles travel more
    // than 1 meter, they disappear
    let projectiles = new ActorPoolSystem();
    populateProjectilePool(projectiles, {
      size: 100, strength: 1, range: .5, immuneToCollisions: true, disappearOnCollide: true, gravityAffectsProjectiles: false,
      bodyMaker: () => new CircleBody({ radius: 0.125, cx: -100, cy: -100 }, stage.world, { density: 0.01 }),
      appearanceMaker: () => new FilledCircle({ radius: 0.125, fillColor: "#777777", z: 0 }),
    });

    // Throw in the direction the hero is facing
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_TAB, () => {
      let V = 1;
      let p = projectiles.get()?.role as (Projectile | undefined);
      let d = hero.state.current.direction;
      if (d == DIRECTION.W || d == DIRECTION.NW || d == DIRECTION.SW) p?.tossFrom(hero, 0, 0.3, -V, 0);
      else if (d == DIRECTION.E || d == DIRECTION.SE || d == DIRECTION.NE) p?.tossFrom(hero, 0, 0.3, V, 0);
      else if (d == DIRECTION.N) p?.tossFrom(hero, 0, 0, 0, -V);
      else if (d == DIRECTION.S) p?.tossFrom(hero, 0, 0.4, 0, V);
    });

    // Here is a seed.  We put one here each day
    Actor.Make({
      rigidBody: new CircleBody({ cx: 8, cy: 8, radius: .1 }),
      appearance: new FilledCircle({ radius: .1, fillColor: "#00FF00" }),
      role: new Goodie({ onCollect: () => { stage.storage.setSession("seeds", 1 + (stage.storage.getSession("seeds") ?? 0)); return true; } }),
    });

    // Log the day
    Actor.Make({
      rigidBody: new CircleBody({ cx: .125, cy: .25, radius: .001 }, stage.hud),
      appearance: new TextSprite({ face: "Arial", size: 36, color: "#000000", center: false }, () => "Day: " + (stage.storage.getSession("day"))),
    });

    // How many seeds have we collected
    Actor.Make({
      rigidBody: new CircleBody({ cx: .5, cy: .75, radius: .001 }, stage.hud),
      appearance: new TextSprite({ face: "Arial", size: 36, color: "#000000", center: false }, () => "x " + (stage.storage.getSession("seeds") ?? 0)),
    });
    Actor.Make({
      rigidBody: new CircleBody({ cx: .25, cy: 1, radius: .1 }, stage.hud),
      appearance: new FilledCircle({ radius: .1, fillColor: "#00FF00" }),
    });

    // How many plants have we collected
    Actor.Make({
      rigidBody: new CircleBody({ cx: .5, cy: 1.25, radius: .001 }, stage.hud),
      appearance: new TextSprite({ face: "Arial", size: 36, color: "#000000", center: false }, () => "x " + (stage.storage.getSession("plants") ?? 0)),
    });
    Actor.Make({
      rigidBody: new CircleBody({ cx: .25, cy: 1.5, radius: .1 }, stage.hud),
      appearance: new FilledCircle({ radius: .1, fillColor: "#FFFF00" }),
    });

    // The bed takes us to "tomorrow"
    Actor.Make({
      rigidBody: new BoxBody({ cx: 18, cy: 2, width: 3, height: 1.75 }),
      appearance: new FilledBox({ width: 3, height: 1.75, fillColor: "#0000FF" }),
      role: new Obstacle({
        heroCollision: () => {
          stage.requestOverlay((overlay: Scene) => {
            Actor.Make({
              rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, overlay),
              appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
              gestures: {
                tap: () => {
                  stage.clearOverlay();
                  stage.storage.setSession("day", 1 + (stage.storage.getSession("day")));
                  stage.switchTo(game, 1); return true;
                }
              },
            });
            Actor.Make({
              rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .01 }, overlay),
              appearance: new TextSprite({ face: "Arial", size: 36, color: "#FFFFFF", center: true }, "Good Night..."),
            });
          }, false);
        }
      })
    })

    // Initialize the plant count
    stage.storage.setSession("plants", (stage.storage.getSession("plants") ?? 0));

    // We can plant a seed on one of the four dirt patches
    // We'll say 0 means "not planted", 1 means "planted", 2 means "watered", and 3 means "ripe"
    // First, make sure we have the session storage configured
    if (stage.storage.getSession("dirt") == undefined)
      stage.storage.setSession("dirt", [0, 0, 0, 0]);

    // This is where we "advance" the state for today
    let dirt = stage.storage.getSession("dirt");
    for (let d = 0; d < 4; ++d) {
      if (dirt[d] == 1) dirt[d] = 0; // If you didn't water it, it died
      else if (dirt[d] == 3) dirt[d] = 0; // If you didn't harvest it, it withered
      else if (dirt[d] == 2) dirt[d] = 3; // If you watered it, it grew
    }
    stage.storage.setSession("dirt", dirt);
    let colors = ["#000000", "#00FF00", "#0000FF", "#FFFF00"];

    for (let d = 0; d < 4; ++d) {
      let patch = Actor.Make({
        rigidBody: new CircleBody({ cx: (7.5 + d), cy: 9, radius: .5 }),
        appearance: new FilledCircle({ radius: .5, fillColor: colors[dirt[d]] }),
        role: new Obstacle({
          heroCollision: (thisActor: Actor) => {
            if (stage.storage.getSession("seeds") > 0 && dirt[thisActor.extra.id] == 0) {
              stage.storage.setSession("seeds", stage.storage.getSession("seeds") - 1);
              dirt[thisActor.extra.id] = 1;
              (thisActor.appearance as FilledCircle).fillColor = colors[1];
            }
            else if (dirt[thisActor.extra.id] == 3) {
              dirt[thisActor.extra.id] = 0;
              (thisActor.appearance as FilledCircle).fillColor = colors[0];
              stage.storage.setSession("plants", stage.storage.getSession("plants") + 1);
            }
          }
        }),
      });
      patch.extra.id = d;
      (patch.role as Obstacle).onProjectileCollision = () => {
        if (dirt[patch.extra.id] == 1) {
          dirt[patch.extra.id] = 2;
          (patch.appearance as FilledCircle).fillColor = colors[2];
        }
        return false;
      }
    }
  }

  else if (level == 2) {
    // Draw some walls, but make the screen pretty big
    Actor.Make({
      appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 16, cy: -.05, width: 32, height: .1 }),
      role: new Obstacle(),
    });
    Actor.Make({
      appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 16, cy: 18.05, width: 32, height: .1 }),
      role: new Obstacle(),
    });
    Actor.Make({
      appearance: new FilledBox({ width: .1, height: 18, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: -.05, cy: 9, width: .1, height: 18 }),
      role: new Obstacle(),
    });
    Actor.Make({
      appearance: new FilledBox({ width: .1, height: 18, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 32.05, cy: 9, width: .1, height: 18 }),
      role: new Obstacle(),
    });
    Actor.Make({
      appearance: new ImageSprite({ width: 32, height: 18, img: "noise.png", z: -2 }),
      rigidBody: new BoxBody({ cx: 16, cy: 9, width: 32, height: 18 })
    })

    // A portal to the other level
    Actor.Make({
      appearance: new FilledCircle({ radius: .5, fillColor: "#000000" }),
      rigidBody: new CircleBody({ cx: 1, cy: 1, radius: .5 }),
      role: new Sensor(() => stage.switchTo(game, 1))
    });

    // Draw a hero.  Note that the animations are pretty tricky
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

    const hero = Actor.Make({
      rigidBody: new PolygonBody({ cx: 0.5, cy: 8.1, vertices: [-.5, .9, .5, .9, .5, -.5, -.5, -.5] }, stage.world, { density: 1, disableRotation: true }),
      appearance: new AnimatedSprite({ width: 4, height: 4, animations, remap }),
      role: new Hero(),
      movement: new StandardMovement(),
    });
    stage.world.camera.setCameraFocus(hero);
    stage.world.camera.setBounds(0, 0, 32, 18);

    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => ((hero.movement as StandardMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as StandardMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as StandardMovement).updateXVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as StandardMovement).updateXVelocity(0)));

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as StandardMovement).updateYVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as StandardMovement).updateYVelocity(5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as StandardMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as StandardMovement).updateXVelocity(5)));

    // set up a pool of projectiles, but now once the projectiles travel more
    // than 1 meter, they disappear
    let projectiles = new ActorPoolSystem();

    // set up the pool with one projectile
    {
      let appearance = new FilledCircle({ radius: .5, fillColor: "#00000000", z: 0 });
      let rigidBody = new CircleBody({ radius: .5, cx: -100, cy: -100 }, stage.world, { density: 0.01 });
      rigidBody.body.SetGravityScale(1);
      rigidBody.setCollisionsEnabled(false);
      let reclaimer = (actor: Actor) => {
        projectiles.put(actor);
        actor.enabled = false;
      }
      let role = new Projectile({ damage: 1, range: 8, disappearOnCollide: false, reclaimer, });
      let p = Actor.Make({ appearance, rigidBody, movement: new ProjectileMovement(), role });
      projectiles.put(p);
    }

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

    // Log the day
    Actor.Make({
      rigidBody: new CircleBody({ cx: .125, cy: .25, radius: .001 }, stage.hud),
      appearance: new TextSprite({ face: "Arial", size: 36, color: "#000000", center: false }, () => "Day: " + (stage.storage.getSession("day"))),
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
    Actor.Make({
      appearance: new AnimatedSprite({ width: 2, height: 2, animations, remap }),
      rigidBody: new PolygonBody({ cx: 14.5, cy: 8.1, vertices: [-.5, .9, .5, .9, .5, -.5, -.5, -.5] }, stage.world, { density: 1, disableRotation: true }),
      movement: new PathMovement(new Path().to(14.5, 8.1).to(18.5, 8.1).to(14.5, 8.1), 2.5, true),
      role: new Enemy({ damage: 1, onDefeated: () => { stage.storage.setSession("lizards", 1 + stage.storage.getSession("lizards")); } })
    });

    stage.score.onLose = { level, builder: game };
    stage.score.onWin = { level, builder: game };

    // How many enemies have we defeated
    if (!stage.storage.getSession("lizards"))
      stage.storage.setSession("lizards", 0)
    Actor.Make({
      rigidBody: new CircleBody({ cx: .5, cy: .75, radius: .001 }, stage.hud),
      appearance: new TextSprite({ face: "Arial", size: 36, color: "#000000", center: false }, () => "x " + stage.storage.getSession("lizards")),
    });
    Actor.Make({
      rigidBody: new CircleBody({ cx: .25, cy: .875, radius: .1 }, stage.hud),
      appearance: new ImageSprite({ width: .5, height: .5, img: "lizard_walk_r_0.png" }),
    });
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), game);

/**
 * Put some appropriately-configured projectiles into the projectile system
 *
 * @param cfg                           Configuration options for the
 *                                      projectiles
 * @param cfg.size                      The number of projectiles that can ever
 *                                      be on screen at once
 * @param cfg.bodyMaker                 Make each projectile's initial rigid
 *                                      body
 * @param cfg.appearanceMaker           Make each projectile's appearance
 * @param cfg.strength                  The amount of damage a projectile can do
 *                                      to enemies
 * @param cfg.multiplier                A multiplier on projectile speed
 * @param cfg.immuneToCollisions        Should projectiles pass through walls
 * @param cfg.gravityAffectsProjectiles Should projectiles be subject to gravity
 * @param cfg.fixedVectorVelocity       A fixed velocity for all projectiles
 * @param cfg.rotateVectorToss          Should projectiles be rotated in the
 *                                      direction they are tossed?
 * @param cfg.soundEffects              A sound to play when a projectile
 *                                      disappears
 * @param cfg.randomImageSources        A set of image names to randomly assign
 *                                      to projectiles' appearance
 * @param cfg.range                     Limit the range that projectiles can
 *                                      travel?
 * @param cfg.disappearOnCollide        Should projectiles disappear when they
 *                                      collide with each other?
 */
function populateProjectilePool(pool: ActorPoolSystem, cfg: { size: number, bodyMaker: () => RigidBodyComponent, appearanceMaker: () => AppearanceComponent, strength: number, multiplier?: number, immuneToCollisions: boolean, gravityAffectsProjectiles?: boolean, fixedVectorVelocity?: number, rotateVectorToss?: boolean, soundEffects?: SoundEffectComponent, randomImageSources?: string[], range: number, disappearOnCollide: boolean }) {
  // set up the pool of projectiles
  for (let i = 0; i < cfg.size; ++i) {
    let appearance = cfg.appearanceMaker();
    let rigidBody = cfg.bodyMaker();
    if (!!cfg.gravityAffectsProjectiles)
      rigidBody.body.SetGravityScale(0);
    else
      rigidBody.body.SetGravityScale(1);
    rigidBody.setCollisionsEnabled(!cfg.immuneToCollisions);
    let reclaimer = (actor: Actor) => {
      pool.put(actor);
      actor.enabled = false;
    }
    let role = new Projectile({ damage: cfg.strength, range: cfg.range, disappearOnCollide: cfg.disappearOnCollide, reclaimer, randomImageSources: cfg.randomImageSources });
    // Put in some code for eliminating the projectile quietly if it has
    // traveled too far
    role.prerenderTasks.push((_elapsedMs: number, actor?: Actor) => {
      if (!actor) return;
      if (!actor.enabled) return;
      let role = actor.role as Projectile;
      let body = actor.rigidBody.body;
      let dx = Math.abs(body.GetPosition().x - role.rangeFrom.x);
      let dy = Math.abs(body.GetPosition().y - role.rangeFrom.y);
      if ((dx * dx + dy * dy) > (role.range * role.range)) reclaimer(actor);
    });
    let p = Actor.Make({ appearance, rigidBody, movement: new ProjectileMovement(cfg), role, sounds: cfg.soundEffects });
    pool.put(p);
  }
}
