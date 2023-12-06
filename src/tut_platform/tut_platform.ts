import { initializeAndLaunch } from "../jetlag/Stage";
import { AnimationSequence, AnimationState, GameConfig, Sides } from "../jetlag/Config";
import { AnimatedSprite, AppearanceComponent, FilledBox, FilledCircle, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { ExplicitMovement, Path, PathMovement, ProjectileMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody, RigidBodyComponent } from "../jetlag/Components/RigidBody";
import { Destination, Enemy, Goodie, Hero, Obstacle, Projectile } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { SoundEffectComponent } from "../jetlag/Components/SoundEffect";
import { ActorPoolSystem } from "../jetlag/Systems/ActorPool";
import { DIRECTION } from "../jetlag/Components/StateManager";
import { Scene } from "../jetlag/Entities/Scene";

/**
 * GameConfig stores things like screen dimensions and other game configuration,
 * as well as the names of all the assets (images and sounds) used by this game.
 */
export class TutPlatformConfig implements GameConfig {
  // It's very unlikely that you'll want to change these next four values.
  // Hover over them to see what they mean.
  pixelMeterRatio = 100;
  screenDimensions = { width: 1600, height: 900 };
  adaptToScreenSize = true;

  // When you deploy your game, you'll want to change all of these
  canVibrate = true;
  forceAccelerometerOff = true;
  storageKey = "com.me.my_jetlag_game.storage";
  hitBoxes = true;

  // Here's where we name all the images/sounds/background music files.  Make
  // sure names don't have spaces or other funny characters, and make sure you
  // put the corresponding files in the folder identified by `resourcePrefix`.
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = [];
  imageNames = [
    // We'll use these for walking
    "spritesheets/alien_walk_l_0.png", "spritesheets/alien_walk_l_1.png", "spritesheets/alien_walk_l_2.png",
    "spritesheets/alien_walk_l_3.png", "spritesheets/alien_walk_l_4.png", "spritesheets/alien_walk_l_5.png",
    "spritesheets/alien_walk_l_6.png", "spritesheets/alien_walk_l_7.png", "spritesheets/alien_walk_l_8.png",
    //
    "spritesheets/alien_walk_r_0.png", "spritesheets/alien_walk_r_1.png", "spritesheets/alien_walk_r_2.png",
    "spritesheets/alien_walk_r_3.png", "spritesheets/alien_walk_r_4.png", "spritesheets/alien_walk_r_5.png",
    "spritesheets/alien_walk_r_6.png", "spritesheets/alien_walk_r_7.png", "spritesheets/alien_walk_r_8.png",

    // We'll use these for tossing projectiles
    "spritesheets/alien_thrust_l_0.png", "spritesheets/alien_thrust_l_1.png", "spritesheets/alien_thrust_l_2.png",
    "spritesheets/alien_thrust_l_3.png", "spritesheets/alien_thrust_l_4.png", "spritesheets/alien_thrust_l_5.png",
    "spritesheets/alien_thrust_l_6.png", "spritesheets/alien_thrust_l_7.png",
    //
    "spritesheets/alien_thrust_r_0.png", "spritesheets/alien_thrust_r_1.png", "spritesheets/alien_thrust_r_2.png",
    "spritesheets/alien_thrust_r_3.png", "spritesheets/alien_thrust_r_4.png", "spritesheets/alien_thrust_r_5.png",
    "spritesheets/alien_thrust_r_6.png", "spritesheets/alien_thrust_r_7.png",

    // We'll use these for jumping
    "spritesheets/alien_cast_r_0.png", "spritesheets/alien_cast_r_1.png", "spritesheets/alien_cast_r_2.png",
    "spritesheets/alien_cast_r_3.png", "spritesheets/alien_cast_r_4.png", "spritesheets/alien_cast_r_5.png",
    "spritesheets/alien_cast_r_6.png",
    //
    "spritesheets/alien_cast_l_0.png", "spritesheets/alien_cast_l_1.png", "spritesheets/alien_cast_l_2.png",
    "spritesheets/alien_cast_l_3.png", "spritesheets/alien_cast_l_4.png", "spritesheets/alien_cast_l_5.png",
    "spritesheets/alien_cast_l_6.png",

    // We'll use these for punching
    "spritesheets/alien_slash_r_0.png", "spritesheets/alien_slash_r_1.png", "spritesheets/alien_slash_r_2.png",
    "spritesheets/alien_slash_r_3.png", "spritesheets/alien_slash_r_4.png", "spritesheets/alien_slash_r_5.png",
    //
    "spritesheets/alien_slash_l_0.png", "spritesheets/alien_slash_l_1.png", "spritesheets/alien_slash_l_2.png",
    "spritesheets/alien_slash_l_3.png", "spritesheets/alien_slash_l_4.png", "spritesheets/alien_slash_l_5.png",

    // The bad guy... just walking
    "spritesheets/lizard_walk_l_0.png", "spritesheets/lizard_walk_l_1.png", "spritesheets/lizard_walk_l_2.png",
    "spritesheets/lizard_walk_l_3.png", "spritesheets/lizard_walk_l_4.png", "spritesheets/lizard_walk_l_5.png",
    "spritesheets/lizard_walk_l_6.png", "spritesheets/lizard_walk_l_7.png", "spritesheets/lizard_walk_l_8.png",
    //
    "spritesheets/lizard_walk_r_0.png", "spritesheets/lizard_walk_r_1.png", "spritesheets/lizard_walk_r_2.png",
    "spritesheets/lizard_walk_r_3.png", "spritesheets/lizard_walk_r_4.png", "spritesheets/lizard_walk_r_5.png",
    "spritesheets/lizard_walk_r_6.png", "spritesheets/lizard_walk_r_7.png", "spritesheets/lizard_walk_r_8.png",

    // Layers for Parallax backgrounds
    "mid.png", "back.png",

    // Coins
    "coin0.png", "coin1.png", "coin2.png", "coin3.png", "coin4.png", "coin5.png", "coin6.png", "coin7.png",
  ];

  // The name of the function that builds the initial screen of the game
  gameBuilder = tut_platform;
}

/**
 * build the first "level" of a game.  Remember that opening scenes, cut scenes,
 * level choosers, the store, etc., are all "levels".  You might want to use
 * different functions to group different functionalities, with multiple
 * "levels" in each function.
 *
 * @param level Which level should be displayed
 */
export function tut_platform(_level: number) {
  // Draw a word that is 32x9 meters, with downward gravity
  stage.world.camera.setBounds(0, 0, 32, 9);
  stage.world.setGravity(0, 10);

  // Put a box around the world, so we can't go off the screen
  drawBoundingBox(0, 0, 32, 9, .1, { density: 10 });

  let animations = new Map();

  let remap = new Map();
  animations.set(AnimationState.WALK_W, new AnimationSequence(true)
    .to("spritesheets/alien_walk_l_0.png", 75).to("spritesheets/alien_walk_l_1.png", 75)
    .to("spritesheets/alien_walk_l_2.png", 75).to("spritesheets/alien_walk_l_3.png", 75)
    .to("spritesheets/alien_walk_l_4.png", 75).to("spritesheets/alien_walk_l_5.png", 75)
    .to("spritesheets/alien_walk_l_6.png", 75).to("spritesheets/alien_walk_l_7.png", 75)
    .to("spritesheets/alien_walk_l_8.png", 75));

  animations.set(AnimationState.WALK_E, new AnimationSequence(true)
    .to("spritesheets/alien_walk_r_0.png", 75).to("spritesheets/alien_walk_r_1.png", 75)
    .to("spritesheets/alien_walk_r_2.png", 75).to("spritesheets/alien_walk_r_3.png", 75)
    .to("spritesheets/alien_walk_r_4.png", 75).to("spritesheets/alien_walk_r_5.png", 75)
    .to("spritesheets/alien_walk_r_6.png", 75).to("spritesheets/alien_walk_r_7.png", 75)
    .to("spritesheets/alien_walk_r_8.png", 75));

  animations.set(AnimationState.JUMP_W, new AnimationSequence(true)
    .to("spritesheets/alien_cast_l_0.png", 75).to("spritesheets/alien_cast_l_1.png", 75)
    .to("spritesheets/alien_cast_l_2.png", 75).to("spritesheets/alien_cast_l_3.png", 75)
    .to("spritesheets/alien_cast_l_4.png", 8000).to("spritesheets/alien_cast_l_5.png", 75)
    .to("spritesheets/alien_cast_l_6.png", 75));
  remap.set(AnimationState.JUMP_IDLE_W, AnimationState.JUMP_W);

  animations.set(AnimationState.JUMP_E, new AnimationSequence(true)
    .to("spritesheets/alien_cast_r_0.png", 75).to("spritesheets/alien_cast_r_1.png", 75)
    .to("spritesheets/alien_cast_r_2.png", 75).to("spritesheets/alien_cast_r_3.png", 75)
    .to("spritesheets/alien_cast_r_4.png", 8000).to("spritesheets/alien_cast_r_5.png", 75)
    .to("spritesheets/alien_cast_r_6.png", 75));
  remap.set(AnimationState.JUMP_IDLE_E, AnimationState.JUMP_E);

  animations.set(AnimationState.TOSS_W, new AnimationSequence(true)
    .to("spritesheets/alien_thrust_l_0.png", 10).to("spritesheets/alien_thrust_l_1.png", 10)
    .to("spritesheets/alien_thrust_l_2.png", 10).to("spritesheets/alien_thrust_l_3.png", 10)
    .to("spritesheets/alien_thrust_l_4.png", 75).to("spritesheets/alien_thrust_l_5.png", 50)
    .to("spritesheets/alien_thrust_l_6.png", 50).to("spritesheets/alien_thrust_l_7.png", 50));
  remap.set(AnimationState.TOSS_IDLE_W, AnimationState.TOSS_W);

  animations.set(AnimationState.TOSS_E, new AnimationSequence(true)
    .to("spritesheets/alien_thrust_r_0.png", 10).to("spritesheets/alien_thrust_r_1.png", 10)
    .to("spritesheets/alien_thrust_r_2.png", 10).to("spritesheets/alien_thrust_r_3.png", 10)
    .to("spritesheets/alien_thrust_r_4.png", 75).to("spritesheets/alien_thrust_r_5.png", 50)
    .to("spritesheets/alien_thrust_r_6.png", 50).to("spritesheets/alien_thrust_r_7.png", 50));
  remap.set(AnimationState.TOSS_IDLE_E, AnimationState.TOSS_E);

  animations.set(AnimationState.IDLE_W, new AnimationSequence(true)
    .to("spritesheets/alien_thrust_l_0.png", 750).to("spritesheets/alien_thrust_l_1.png", 75));

  animations.set(AnimationState.IDLE_E, new AnimationSequence(true)
    .to("spritesheets/alien_thrust_r_0.png", 750).to("spritesheets/alien_thrust_r_1.png", 75));

  let h = Actor.Make({
    appearance: new AnimatedSprite({ width: 2, height: 2, animations, remap }),
    rigidBody: PolygonBody.Polygon({ cx: 0.5, cy: 8.1, vertices: [-.5, .9, .5, .9, .5, -.5, -.5, -.5] }, stage.world, { density: 1, disableRotation: true }),
    movement: new ExplicitMovement(),
    role: new Hero()
  });
  (h.appearance as AnimatedSprite).stateSelector = AnimatedSprite.sideViewAnimationTransitions;
  // center the camera a little ahead of the hero, so we can see more of the
  // world during gameplay
  stage.world.camera.setCameraFocus(h, 6, 0);

  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (h.movement as ExplicitMovement).updateXVelocity(0));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ExplicitMovement).updateXVelocity(0));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (h.movement as ExplicitMovement).updateXVelocity(-2.5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ExplicitMovement).updateXVelocity(2.5));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).jump(0, -10));

  Actor.Make({
    appearance: new FilledCircle({ radius: 0.4, fillColor: "#ff7575" }),
    rigidBody: CircleBody.Circle({ cx: 31, cy: 8.25, radius: 0.4, }, stage.world),
    role: new Destination(),
  });

  stage.score.setVictoryDestination(1);

  // set up the backgrounds
  stage.backgroundColor = "#17b4ff";
  stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "back.png" }), speed: 1 });
  stage.background.addLayer({ cx: 0, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });

  // set up a pool of projectiles, but now once the projectiles travel more
  // than 16 meters, they disappear
  let projectiles = new ActorPoolSystem();
  populateProjectilePool(projectiles, {
    size: 100, strength: 1, range: 16, immuneToCollisions: true, disappearOnCollide: true, // gravityAffectsProjectiles: false,
    bodyMaker: () => CircleBody.Circle({ radius: 0.125, cx: -100, cy: -100 }, stage.world, { density: 0.01, elasticity: 1 }),
    appearanceMaker: () => new FilledCircle({ radius: 0.125, fillColor: "#777777", z: 0 }),
  });

  // Throw in the direction the hero is facing
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_TAB, () => {
    if (h.state.current.last_ew == DIRECTION.W || h.state.current.direction == DIRECTION.W || h.state.current.direction == DIRECTION.NW || h.state.current.direction == DIRECTION.SW)
      (projectiles.get()?.role as (Projectile | undefined))?.tossFrom(h, -.5, .3, -5, 0);
    else
      (projectiles.get()?.role as (Projectile | undefined))?.tossFrom(h, .5, .3, 5, 0)
  });

  Actor.Make({
    appearance: new FilledBox({ width: 2, height: .2, fillColor: "#444444" }),
    rigidBody: BoxBody.Box({ width: 2, height: .2, cx: 3, cy: 7.4 }),
    role: new Obstacle(),
  })

  Actor.Make({
    appearance: new FilledBox({ width: 2, height: .2, fillColor: "#444444" }),
    rigidBody: BoxBody.Box({ width: 2, height: .2, cx: 7, cy: 5.4 }),
    role: new Obstacle({ jumpReEnableSides: [DIRECTION.N] }),
  })

  Actor.Make({
    appearance: new FilledBox({ width: 4, height: .2, fillColor: "#444444" }),
    rigidBody: BoxBody.Box({ width: 4, height: .2, cx: 13, cy: 3.4 }),
    role: new Obstacle({ jumpReEnableSides: [DIRECTION.N] }),
  })

  // Coins on the top platform
  animations = new Map();
  animations.set(AnimationState.IDLE_E, new AnimationSequence(true).to("coin0.png", 100).to("coin1.png", 100).to("coin2.png", 100).to("coin3.png", 100).to("coin4.png", 100).to("coin5.png", 100).to("coin6.png", 100).to("coin7.png", 100))
  for (let cx of [11.5, 12.5, 13.5, 14.5]) {
    Actor.Make({
      appearance: new AnimatedSprite({ width: .5, height: .5, animations }),
      rigidBody: CircleBody.Circle({ radius: .25, cx, cy: 3.05 }),
      role: new Goodie(),
    });
  }

  // HUD Coin Counter
  Actor.Make({
    appearance: new AnimatedSprite({ width: .5, height: .5, animations }),
    rigidBody: CircleBody.Circle({ radius: .15, cx: 14.5, cy: 0.5 }, stage.hud),
    role: new Goodie(),
  });
  Actor.Make({
    appearance: new TextSprite({ center: false, face: "Arial", size: 36, color: "#ffffff" }, () => "x " + stage.score.getGoodieCount(0)),
    rigidBody: CircleBody.Circle({ radius: .01, cx: 15, cy: 0.25 }, stage.hud),
    role: new Goodie(),
  });


  animations = new Map();
  animations.set(AnimationState.WALK_W, new AnimationSequence(true)
    .to("spritesheets/lizard_walk_l_0.png", 75).to("spritesheets/lizard_walk_l_1.png", 75)
    .to("spritesheets/lizard_walk_l_2.png", 75).to("spritesheets/lizard_walk_l_3.png", 75)
    .to("spritesheets/lizard_walk_l_4.png", 75).to("spritesheets/lizard_walk_l_5.png", 75)
    .to("spritesheets/lizard_walk_l_6.png", 75).to("spritesheets/lizard_walk_l_7.png", 75)
    .to("spritesheets/lizard_walk_l_8.png", 75));

  animations.set(AnimationState.WALK_E, new AnimationSequence(true)
    .to("spritesheets/lizard_walk_r_0.png", 75).to("spritesheets/lizard_walk_r_1.png", 75)
    .to("spritesheets/lizard_walk_r_2.png", 75).to("spritesheets/lizard_walk_r_3.png", 75)
    .to("spritesheets/lizard_walk_r_4.png", 75).to("spritesheets/lizard_walk_r_5.png", 75)
    .to("spritesheets/lizard_walk_r_6.png", 75).to("spritesheets/lizard_walk_r_7.png", 75)
    .to("spritesheets/lizard_walk_r_8.png", 75));
  remap = new Map();
  remap.set(AnimationState.IDLE_E, AnimationState.WALK_E);
  // Enemy to defeat
  Actor.Make({
    appearance: new AnimatedSprite({ width: 2, height: 2, animations, remap }),
    rigidBody: PolygonBody.Polygon({ cx: 14.5, cy: 8.1, vertices: [-.5, .9, .5, .9, .5, -.5, -.5, -.5] }, stage.world, { density: 1, disableRotation: true }),
    movement: new PathMovement(new Path().to(14.5, 8.1).to(18.5, 8.1).to(14.5, 8.1), 2.5, true),
    role: new Enemy()
  });

  stage.score.onLose = { level: 1, builder: tut_platform };
  stage.score.onWin = { level: 1, builder: tut_platform };

  stage.score.winSceneBuilder = (overlay: Scene, _screenshot: ImageSprite) => {
    Actor.Make({
      appearance: _screenshot,
      // appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
      rigidBody: BoxBody.Box({ cx: 8, cy: 4.5, width: 16, height: 9 }, overlay),
      gestures: {
        tap: () => {
          stage.clearOverlay();
          stage.switchTo(stage.score.onWin.builder, stage.score.onWin.level);
          return true;
        }
      }
    });
    Actor.Make({
      appearance: new TextSprite({ center: true, face: "Arial", size: 44, color: "#FFFFFF" }, "Great Job!"),
      rigidBody: CircleBody.Circle({ cx: 8, cy: 4.5, radius: .1 }, overlay),
    });
  };

  stage.score.loseSceneBuilder = (overlay: Scene, screenshot: ImageSprite) => {
    Actor.Make({
      appearance: screenshot,
      rigidBody: BoxBody.Box({ cx: 8, cy: 4.5, width: 16, height: 9 }, overlay),
      gestures: {
        tap: () => {
          stage.clearOverlay();
          stage.switchTo(stage.score.onLose.builder, stage.score.onLose.level);
          return true;
        }
      }
    });
    Actor.Make({
      appearance: new TextSprite({ center: true, face: "Arial", size: 44, color: "#FFFFFF" }, "Try Again"),
      rigidBody: CircleBody.Circle({ cx: 8, cy: 4.5, radius: .1 }, overlay),
    });
  };

}

// call the function that kicks off the game
initializeAndLaunch("game-player", new TutPlatformConfig());

/**
 * Draw a box on the scene
 *
 * Note: the box is actually four narrow rectangles
 *
 * @param x0          X coordinate of left side
 * @param y0          Y coordinate of top
 * @param x1          X coordinate of right side
 * @param y1          Y coordinate of bottom
 * @param thickness   How thick should the box be?
 * @param physicsCfg  Common extra configuration options for the walls
 */
function drawBoundingBox(x0: number, y0: number, x1: number, y1: number, thickness: number, physicsCfg: { density?: number, elasticity?: number, friction?: number, disableRotation?: boolean, collisionsEnabled?: boolean, stickySides?: Sides[], stickyDelay?: number, singleRigidSide?: Sides, passThroughId?: number, rotationSpeed?: number, dynamic?: boolean } = {}) {
  // Bottom box:
  let width = Math.abs(x0 - x1);
  let cfg = { box: true, cx: x0 + width / 2, cy: y1 + thickness / 2, width: width + 2 * thickness, height: thickness, img: "" };
  let floor = Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: BoxBody.Box(cfg, stage.world, physicsCfg),
    role: new Obstacle(),
  });
  (floor.role as Obstacle).onProjectileCollision = () => false;


  // The top only differs by translating the Y from the bottom
  // cfg.cy -= (thickness + Math.abs(y0 - y1));// = { box: true, cx: x0 + width / 2, cy: y0 - height / 2 + .5, width, height, img: "" };
  // Actor.Make({
  //   appearance: new ImageSprite(cfg),
  //   rigidBody: BoxBody.Box(cfg, stage.world, physicsCfg),
  //   role: new Obstacle({ jumpReEnableSides: [] }),
  // });

  // Right box:
  let height = Math.abs(y0 - y1);
  cfg = { box: true, cx: x1 + thickness / 2, cy: y0 + height / 2, height: height + 2 * thickness, width: thickness, img: "" };
  Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: BoxBody.Box(cfg, stage.world, physicsCfg),
    role: new Obstacle({ jumpReEnableSides: [] }),
  });

  // The left only differs by translating the X
  cfg.cx -= (thickness + Math.abs(x0 - x1));
  Actor.Make({
    appearance: new ImageSprite(cfg),
    rigidBody: BoxBody.Box(cfg, stage.world, physicsCfg),
    role: new Obstacle({ jumpReEnableSides: [] }),
  });
}

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
export function populateProjectilePool(pool: ActorPoolSystem, cfg: { size: number, bodyMaker: () => RigidBodyComponent, appearanceMaker: () => AppearanceComponent, strength: number, multiplier?: number, immuneToCollisions: boolean, gravityAffectsProjectiles?: boolean, fixedVectorVelocity?: number, rotateVectorToss?: boolean, soundEffects?: SoundEffectComponent, randomImageSources?: string[], range: number, disappearOnCollide: boolean }) {
  // set up the pool of projectiles
  for (let i = 0; i < cfg.size; ++i) {
    let appearance = cfg.appearanceMaker();
    let rigidBody = cfg.bodyMaker();
    if (!!cfg.gravityAffectsProjectiles)
      rigidBody.body.SetGravityScale(0);
    else
      rigidBody.body.SetGravityScale(1);
    rigidBody.setCollisionsEnabled(cfg.immuneToCollisions);
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