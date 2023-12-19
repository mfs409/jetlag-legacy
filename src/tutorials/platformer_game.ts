import { initializeAndLaunch } from "../jetlag/Stage";
import { AnimationSequence, AnimationState, JetLagGameConfig } from "../jetlag/Config";
import { AnimatedSprite, FilledBox, FilledCircle, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { ManualMovement, Path, PathMovement, ProjectileMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody } from "../jetlag/Components/RigidBody";
import { Enemy, Goodie, Hero, Obstacle, Projectile } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { ActorPoolSystem } from "../jetlag/Systems/ActorPool";
import { DIRECTION } from "../jetlag/Components/StateManager";
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
  imageNames = [
    // Sprite sheets for the alien and lizard
    "alien.json", "lizard.json",
    // Extra alien animations (inverted, sepia)
    "inv_alien.json", "sep_alien.json",
    // Layers for Parallax backgrounds
    "mid.png", "back.png",
    // Sprite sheet with the coins (and other stuff that we don't use)
    "sprites.json",
  ];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  if (level == 1) {
    // Draw a word that is 32x9 meters, with downward gravity
    stage.world.camera.setBounds(0, 0, 32, 9);
    stage.world.setGravity(0, 10);

    // Put a box around the world, so we can't go off the screen
    drawBoundingBox(0, 0, 32, 9, .1);

    let animations = new Map();

    animations.set(AnimationState.WALK_W, AnimationSequence.makeSimple({ timePerFrame: 75, repeat: true, images: ["alien_walk_l_0.png", "alien_walk_l_1.png", "alien_walk_l_2.png", "alien_walk_l_3.png", "alien_walk_l_4.png", "alien_walk_l_5.png", "alien_walk_l_6.png", "alien_walk_l_7.png", "alien_walk_l_8.png"] }));
    animations.set(AnimationState.WALK_E, AnimationSequence.makeSimple({ timePerFrame: 75, repeat: true, images: ["alien_walk_r_0.png", "alien_walk_r_1.png", "alien_walk_r_2.png", "alien_walk_r_3.png", "alien_walk_r_4.png", "alien_walk_r_5.png", "alien_walk_r_6.png", "alien_walk_r_7.png", "alien_walk_r_8.png"] }));
    animations.set(AnimationState.IDLE_W, new AnimationSequence(true).to("alien_thrust_l_0.png", 750).to("alien_thrust_l_1.png", 75));
    animations.set(AnimationState.IDLE_E, new AnimationSequence(true).to("alien_thrust_r_0.png", 750).to("alien_thrust_r_1.png", 75));

    animations.set(AnimationState.JUMP_W, new AnimationSequence(true).to("alien_cast_l_0.png", 75).to("alien_cast_l_1.png", 75).to("alien_cast_l_2.png", 75).to("alien_cast_l_3.png", 75).to("alien_cast_l_4.png", 8000).to("alien_cast_l_5.png", 75).to("alien_cast_l_6.png", 75));
    animations.set(AnimationState.JUMP_E, new AnimationSequence(true).to("alien_cast_r_0.png", 75).to("alien_cast_r_1.png", 75).to("alien_cast_r_2.png", 75).to("alien_cast_r_3.png", 75).to("alien_cast_r_4.png", 8000).to("alien_cast_r_5.png", 75).to("alien_cast_r_6.png", 75));
    animations.set(AnimationState.TOSS_W, new AnimationSequence(true).to("alien_thrust_l_0.png", 10).to("alien_thrust_l_1.png", 10).to("alien_thrust_l_2.png", 10).to("alien_thrust_l_3.png", 10).to("alien_thrust_l_4.png", 75).to("alien_thrust_l_5.png", 50).to("alien_thrust_l_6.png", 50).to("alien_thrust_l_7.png", 50));
    animations.set(AnimationState.TOSS_E, new AnimationSequence(true).to("alien_thrust_r_0.png", 10).to("alien_thrust_r_1.png", 10).to("alien_thrust_r_2.png", 10).to("alien_thrust_r_3.png", 10).to("alien_thrust_r_4.png", 75).to("alien_thrust_r_5.png", 50).to("alien_thrust_r_6.png", 50).to("alien_thrust_r_7.png", 50));

    animations.set(AnimationState.INV_W, AnimationSequence.makeSimple({ timePerFrame: 75, repeat: true, images: ["inv_alien_walk_l_0.png", "inv_alien_walk_l_1.png", "inv_alien_walk_l_2.png", "inv_alien_walk_l_3.png", "inv_alien_walk_l_4.png", "inv_alien_walk_l_5.png", "inv_alien_walk_l_6.png", "inv_alien_walk_l_7.png", "inv_alien_walk_l_8.png"] }));
    animations.set(AnimationState.INV_E, AnimationSequence.makeSimple({ timePerFrame: 75, repeat: true, images: ["inv_alien_walk_r_0.png", "inv_alien_walk_r_1.png", "inv_alien_walk_r_2.png", "inv_alien_walk_r_3.png", "inv_alien_walk_r_4.png", "inv_alien_walk_r_5.png", "inv_alien_walk_r_6.png", "inv_alien_walk_r_7.png", "inv_alien_walk_r_8.png"] }));
    animations.set(AnimationState.INV_IDLE_W, new AnimationSequence(true).to("inv_alien_thrust_l_0.png", 750).to("inv_alien_thrust_l_1.png", 75));
    animations.set(AnimationState.INV_IDLE_E, new AnimationSequence(true).to("inv_alien_thrust_r_0.png", 750).to("inv_alien_thrust_r_1.png", 75));

    animations.set(AnimationState.CRAWL_W, AnimationSequence.makeSimple({ timePerFrame: 75, repeat: true, images: ["sep_alien_walk_l_0.png", "sep_alien_walk_l_1.png", "sep_alien_walk_l_2.png", "sep_alien_walk_l_3.png", "sep_alien_walk_l_4.png", "sep_alien_walk_l_5.png", "sep_alien_walk_l_6.png", "sep_alien_walk_l_7.png", "sep_alien_walk_l_8.png"] }));
    animations.set(AnimationState.CRAWL_E, AnimationSequence.makeSimple({ timePerFrame: 75, repeat: true, images: ["sep_alien_walk_r_0.png", "sep_alien_walk_r_1.png", "sep_alien_walk_r_2.png", "sep_alien_walk_r_3.png", "sep_alien_walk_r_4.png", "sep_alien_walk_r_5.png", "sep_alien_walk_r_6.png", "sep_alien_walk_r_7.png", "sep_alien_walk_r_8.png"] }));


    let remap = new Map();
    remap.set(AnimationState.JUMP_IDLE_W, AnimationState.JUMP_W);
    remap.set(AnimationState.JUMP_IDLE_E, AnimationState.JUMP_E);
    remap.set(AnimationState.TOSS_IDLE_W, AnimationState.TOSS_W);
    remap.set(AnimationState.TOSS_IDLE_E, AnimationState.TOSS_E);
    remap.set(AnimationState.CRAWL_IDLE_W, AnimationState.CRAWL_W);
    remap.set(AnimationState.CRAWL_IDLE_E, AnimationState.CRAWL_E);

    let h = new Actor({
      appearance: new AnimatedSprite({ width: 2, height: 2, animations, remap }),
      rigidBody: new PolygonBody({ cx: 0.5, cy: 8.1, vertices: [-.5, .9, .5, .9, .5, -.5, -.5, -.5] }, { density: 1, disableRotation: true, passThroughId: 8 }),
      movement: new ManualMovement(),
      role: new Hero()
    });
    (h.appearance as AnimatedSprite).stateSelector = AnimatedSprite.sideViewAnimationTransitions;
    // center the camera a little ahead of the hero, so we can see more of the
    // world during gameplay
    stage.world.camera.setCameraFocus(h, 6, 0);

    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(0));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(0));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => (h.movement as ManualMovement).updateXVelocity(-2.5));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => (h.movement as ManualMovement).updateXVelocity(2.5));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).jump(0, -10));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_C, () => (h.role as Hero).crawlOn(Math.PI / 2));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_C, () => (h.role as Hero).crawlOff(Math.PI / 2));

    new Actor({
      appearance: new FilledCircle({ radius: 0.4, fillColor: "#ff7575" }),
      rigidBody: new CircleBody({ cx: 31, cy: 8.25, radius: 0.4, }),
      role: new Goodie({ onCollect: () => { (h.role as Hero).invincibleRemaining = 15; return true; } }),
    });

    stage.score.setVictoryDestination(1);

    // set up the backgrounds
    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ anchor: { cx: 8, cy: 4.5, }, imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "back.png" }), speed: 1 });
    stage.background.addLayer({ anchor: { cx: 0, cy: 4.5, }, imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // set up a pool of projectiles, but now once the projectiles travel more
    // than 16 meters, they disappear
    let projectiles = new ActorPoolSystem();
    // set up the pool of projectiles
    for (let i = 0; i < 100; ++i) {
      let appearance = new FilledCircle({ radius: 0.125, fillColor: "#777777", z: 0 });
      let rigidBody = new CircleBody({ radius: 0.125, cx: -100, cy: -100 }, { density: 0.01, elasticity: 1, passThroughId: 8 });
      rigidBody.body.SetGravityScale(1);
      rigidBody.setCollisionsEnabled(true);
      let reclaimer = (actor: Actor) => { projectiles.put(actor); }
      let role = new Projectile({ damage: 1, disappearOnCollide: true, reclaimer });
      // Put in some code for eliminating the projectile quietly if it has
      // traveled too far
      let range = 16
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

    // Throw in the direction the hero is facing
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_TAB, () => {
      if (h.state.current.last_ew == DIRECTION.W || h.state.current.direction == DIRECTION.W || h.state.current.direction == DIRECTION.NW || h.state.current.direction == DIRECTION.SW)
        (projectiles.get()?.role as (Projectile | undefined))?.tossFrom(h, -.5, .3, -5, 0);
      else
        (projectiles.get()?.role as (Projectile | undefined))?.tossFrom(h, .5, .3, 5, 0)
    });

    new Actor({
      appearance: new FilledBox({ width: 2, height: .2, fillColor: "#444444" }),
      rigidBody: new BoxBody({ width: 2, height: .2, cx: 3, cy: 7.4 }),
      role: new Obstacle(),
    })

    new Actor({
      appearance: new FilledBox({ width: 2, height: .2, fillColor: "#444444" }),
      rigidBody: new BoxBody({ width: 2, height: .2, cx: 7, cy: 5.4 }),
      role: new Obstacle({ jumpReEnableSides: [DIRECTION.N] }),
    })

    new Actor({
      appearance: new FilledBox({ width: 4, height: .2, fillColor: "#444444" }),
      rigidBody: new BoxBody({ width: 4, height: .2, cx: 13, cy: 3.4 }),
      role: new Obstacle({ jumpReEnableSides: [DIRECTION.N] }),
    })

    // Coins on the top platform
    animations = new Map();
    animations.set(AnimationState.IDLE_E, new AnimationSequence(true).to("coin0.png", 100).to("coin1.png", 100).to("coin2.png", 100).to("coin3.png", 100).to("coin4.png", 100).to("coin5.png", 100).to("coin6.png", 100).to("coin7.png", 100))
    for (let cx of [11.5, 12.5, 13.5, 14.5]) {
      new Actor({
        appearance: new AnimatedSprite({ width: .5, height: .5, animations }),
        rigidBody: new CircleBody({ radius: .25, cx, cy: 3.05 }),
        role: new Goodie(),
      });
    }

    // HUD Coin Counter
    new Actor({
      appearance: new AnimatedSprite({ width: .5, height: .5, animations }),
      rigidBody: new CircleBody({ radius: .15, cx: 14.5, cy: 0.5 }, { scene: stage.hud }),
      role: new Goodie(),
    });
    new Actor({
      appearance: new TextSprite({ center: false, face: "Arial", size: 36, color: "#ffffff" }, () => "x " + stage.score.getGoodieCount(0)),
      rigidBody: new CircleBody({ radius: .01, cx: 15, cy: 0.25 }, { scene: stage.hud }),
      role: new Goodie(),
    });


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
      role: new Enemy()
    });

    stage.score.onLose = { level: 1, builder: builder };
    stage.score.onWin = { level: 1, builder: builder };

    stage.score.winSceneBuilder = (overlay: Scene, _screenshot?: ImageSprite) => {
      new Actor({
        appearance: _screenshot!,
        // appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
        rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
        gestures: {
          tap: () => {
            stage.clearOverlay();
            stage.switchTo(stage.score.onWin.builder, stage.score.onWin.level);
            return true;
          }
        }
      });
      new Actor({
        appearance: new TextSprite({ center: true, face: "Arial", size: 44, color: "#FFFFFF" }, "Great Job!"),
        rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .1 }, { scene: overlay }),
      });
    };

    stage.score.loseSceneBuilder = (overlay: Scene, screenshot?: ImageSprite) => {
      new Actor({
        appearance: screenshot!,
        rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
        gestures: {
          tap: () => {
            stage.clearOverlay();
            stage.switchTo(stage.score.onLose.builder, stage.score.onLose.level);
            return true;
          }
        }
      });
      new Actor({
        appearance: new TextSprite({ center: true, face: "Arial", size: 44, color: "#FFFFFF" }, "Try Again"),
        rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: .1 }, { scene: overlay }),
      });
    };
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);

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
 */
function drawBoundingBox(x0: number, y0: number, x1: number, y1: number, thickness: number) {
  // Bottom box:
  let width = Math.abs(x0 - x1);
  let cfg = { box: true, cx: x0 + width / 2, cy: y1 + thickness / 2, width: width + 2 * thickness, height: thickness, img: "" };
  let floor = new Actor({
    appearance: new ImageSprite(cfg),
    rigidBody: new BoxBody(cfg),
    role: new Obstacle(),
  });
  (floor.role as Obstacle).projectileCollision = () => false;

  // Right box:
  let height = Math.abs(y0 - y1);
  cfg = { box: true, cx: x1 + thickness / 2, cy: y0 + height / 2, height: height + 2 * thickness, width: thickness, img: "" };
  new Actor({
    appearance: new ImageSprite(cfg),
    rigidBody: new BoxBody(cfg),
    role: new Obstacle({ jumpReEnableSides: [] }),
  });

  // The left only differs by translating the X
  cfg.cx -= (thickness + Math.abs(x0 - x1));
  new Actor({
    appearance: new ImageSprite(cfg),
    rigidBody: new BoxBody(cfg),
    role: new Obstacle({ jumpReEnableSides: [] }),
  });
}
