import { initializeAndLaunch } from "../jetlag/Stage";
import { AnimationSequence, AnimationState, JetLagGameConfig } from "../jetlag/Config";
import { AnimatedSprite, FilledBox } from "../jetlag/Components/Appearance";
import { ManualMovement } from "../jetlag/Components/Movement";
import { BoxBody } from "../jetlag/Components/RigidBody";
import { Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";

/**
 * Screen dimensions and other game configuration, such as the names of all
 * the assets (images and sounds) used by this game.
 */
class Config implements JetLagGameConfig {
  // It's very unlikely that you'll want to change these next four values.
  // Hover over them to see what they mean.
  pixelMeterRatio = 100;
  screenDimensions = { width: 1600, height: 900 };
  adaptToScreenSize = true;

  // When you deploy your game, you'll want to change all of these
  canVibrate = true;
  forceAccelerometerOff = true;
  storageKey = "--no-key--";
  hitBoxes = true;

  // Here's where we name all the images/sounds/background music files.  You'll
  // probably want to delete these files from the assets folder, remove them
  // from these lists, and add your own.
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = [];
  imageNames = ["alien.json"];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(_level: number) {
  // Draw four walls, covering the four borders of the world
  Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: .05, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: 16, height: .1, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 8, cy: 8.95, width: 16, height: .1 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: .05, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });
  Actor.Make({
    appearance: new FilledBox({ width: .1, height: 9, fillColor: "#ff0000" }),
    rigidBody: new BoxBody({ cx: 15.95, cy: 4.5, width: .1, height: 9 }),
    role: new Obstacle(),
  });

  // Draw a hero.  Note that the animations are pretty tricky
  let animations = new Map();
  animations.set(AnimationState.WALK_N, new AnimationSequence(true)
    .to("alien_walk_u_0.png", 75).to("alien_walk_u_1.png", 75)
    .to("alien_walk_u_2.png", 75).to("alien_walk_u_3.png", 75)
    .to("alien_walk_u_4.png", 75).to("alien_walk_u_5.png", 75)
    .to("alien_walk_u_6.png", 75).to("alien_walk_u_7.png", 75)
    .to("alien_walk_u_8.png", 75));

  animations.set(AnimationState.WALK_W, new AnimationSequence(true)
    .to("alien_walk_l_0.png", 75).to("alien_walk_l_1.png", 75)
    .to("alien_walk_l_2.png", 75).to("alien_walk_l_3.png", 75)
    .to("alien_walk_l_4.png", 75).to("alien_walk_l_5.png", 75)
    .to("alien_walk_l_6.png", 75).to("alien_walk_l_7.png", 75)
    .to("alien_walk_l_8.png", 75));

  animations.set(AnimationState.WALK_S, new AnimationSequence(true)
    .to("alien_walk_d_0.png", 75).to("alien_walk_d_1.png", 75)
    .to("alien_walk_d_2.png", 75).to("alien_walk_d_3.png", 75)
    .to("alien_walk_d_4.png", 75).to("alien_walk_d_5.png", 75)
    .to("alien_walk_d_6.png", 75).to("alien_walk_d_7.png", 75)
    .to("alien_walk_d_8.png", 75));

  animations.set(AnimationState.WALK_E, new AnimationSequence(true)
    .to("alien_walk_r_0.png", 75).to("alien_walk_r_1.png", 75)
    .to("alien_walk_r_2.png", 75).to("alien_walk_r_3.png", 75)
    .to("alien_walk_r_4.png", 75).to("alien_walk_r_5.png", 75)
    .to("alien_walk_r_6.png", 75).to("alien_walk_r_7.png", 75)
    .to("alien_walk_r_8.png", 75));

  animations.set(AnimationState.IDLE_N, new AnimationSequence(true).to("alien_thrust_u_0.png", 750).to("alien_thrust_u_1.png", 75));
  animations.set(AnimationState.IDLE_W, new AnimationSequence(true).to("alien_thrust_l_0.png", 750).to("alien_thrust_l_1.png", 75));
  animations.set(AnimationState.IDLE_S, new AnimationSequence(true).to("alien_thrust_d_0.png", 750).to("alien_thrust_d_1.png", 75));
  // demonstrate skip-to:
  // animations.set(AnimationState.IDLE_E, new AnimationSequence(true).to("alien_thrust_r_0.png", 7500).to("alien_thrust_r_1.png", 7500));
  animations.set(AnimationState.IDLE_E, new AnimationSequence(true).to("alien_thrust_r_0.png", 750).to("alien_thrust_r_1.png", 75));

  let remap = new Map();
  remap.set(AnimationState.WALK_NW, AnimationState.WALK_W);
  remap.set(AnimationState.WALK_SW, AnimationState.WALK_W);
  remap.set(AnimationState.WALK_NE, AnimationState.WALK_E);
  remap.set(AnimationState.WALK_SE, AnimationState.WALK_E);
  remap.set(AnimationState.IDLE_NW, AnimationState.IDLE_W);
  remap.set(AnimationState.IDLE_SW, AnimationState.IDLE_W);
  remap.set(AnimationState.IDLE_NE, AnimationState.IDLE_E);
  remap.set(AnimationState.IDLE_SE, AnimationState.IDLE_E);

  const hero = Actor.Make({
    rigidBody: new BoxBody({ cx: 3, cy: 4, width: 1, height: 2 }, stage.world),
    appearance: new AnimatedSprite({ width: 2, height: 2, animations, remap }),
    role: new Hero(),
    movement: new ManualMovement(),
  });

  // Demonstrate skip-to
  //  (hero.appearance as AnimatedSprite).skipTo(1, 7000);

  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));
  stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));

  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(-5)));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(5)));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(-5)));
  stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(5)));

  // Obstacles are an important kind of actor.  They can be as simple as walls
  // (indeed, our bounding box is really four obstacles), or they can do more
  // complex things.  In this level, we draw a few obstacles.  Also, all actors
  // can be circles, boxes, or polygons.  We will play around with circle,
  // polygon, and box shapes in this level.
  //
  // We will also use a control to move the hero, instead of tilt.
  //
  // This level also shows how the "welcomeMessage" code works, by building a
  // whole "welcome message" from scratch
  if (level == 12) {
    // Put a border around the level, and create a hero and destination
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 1, cy: 5, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { friction: 0.6 }),
      // The hero will be controlled explicitly via special touches, so give it
      // "explicit" movement.
      movement: new ManualMovement(),
      role: new Hero(),
    });

    cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // Make ONE destination, but indicate that it can hold TWO heroes
    // Let's also say that whenever a hero reaches the destination, a sound
    // will play
    cfg = { cx: 15, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination({ capacity: 2 }),
      sounds: new SoundEffectComponent({ arrive: "high_pitch.ogg" }),
    });


    // We will now create four obstacles.  Two will use a red rectangle as their picture,
    // and two will use a purple ball.  In terms of physics, two will be boxes, two will be
    // circles.  The debug flag (see GameConfig.ts) causes outlines to draw, which reveal
    // the real shape, so we can see when it doesn't match the picture

    // This one looks like a purple ball, but its shape is a box.
    let boxCfg = { cx: 5, cy: 5, width: 0.75, height: 0.75, img: "purple_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { friction: 1 }),
      role: new Obstacle(),
    });

    // This one looks like a ball, and it is a ball
    cfg = { cx: 7, cy: 2, radius: 0.4, width: 0.8, height: 0.8, img: "purple_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { friction: 1 }),
      role: new Obstacle(),
    });

    // This one looks like a square, but it's really a ball
    cfg = { cx: 9, cy: 4, radius: 1.5, width: 3, height: 3, img: "noise.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { friction: 1 }),
      role: new Obstacle(),
    });

    // And finally, a box that looks like a box
    boxCfg = { cx: 9, cy: 7, width: 0.5, height: 2, img: "noise.png" };
    Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { friction: 1 }),
      role: new Obstacle(),
    });

    // I was a little bit deceptive with the fake_box, because I made the height
    // and width match the radius.  Look at what happens when the width and
    // height of the image aren't the same, but there's a radius.
    let oval_cfg = { cx: 13, cy: 3, width: 2, height: .5, radius: 1, img: "purple_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(oval_cfg),
      rigidBody: new CircleBody(oval_cfg, stage.world),
      role: new Obstacle(),
    });

    // This one has a bigger body than its image
    cfg = { cx: 1, cy: 1, radius: 0.5, width: 0.8, height: 0.8, img: "purple_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { friction: 1 }),
      role: new Obstacle(),
    });

    // This one has a smaller body than its image
    cfg = { cx: 8, cy: 1, radius: 0.25, width: 0.8, height: 0.8, img: "purple_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { friction: 1 }),
      role: new Obstacle(),
    });

    // These alternate hitboxes also work for boxes, of course
    Actor.Make({
      appearance: new ImageSprite({ width: 0.7, height: 0.8, img: "noise.png" }),
      rigidBody: new BoxBody({ cx: 14, cy: 1, width: 0.5, height: 0.6 }, stage.world, { friction: 1 }),
      role: new Obstacle(),
    });

    // The most powerful option is to make a polygon.  We can have as many
    // points as we want (but more than 8 is usually crazy), but the polygon
    // needs to be convex.  We provide the points in terms of their distance
    // from the center.  So, for example, here's a circular image with a
    // hexagonal body.
    let polyCfg = {
      cx: 3, cy: 3, width: 2, height: 2, img: "blue_ball.png",
      vertices: [-1, 0, -.5, .866, .5, .866, 1, 0, .5, -.866, -.5, -.866]
    };
    Actor.Make({
      appearance: new ImageSprite(polyCfg),
      rigidBody: new PolygonBody(polyCfg, stage.world, { rotationSpeed: .25 }),
      role: new Obstacle(),
    });

    winMessage("Great Job");

  }

  // Sounds are an important part of games.  Here, we'll make an obstacle play
  // sounds when we collide with it or tap it
  else if (level == 26) {
    // start with a hero who is controlled via Joystick, and a destination
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });

    addJoystickControl(stage.hud,
      { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" },
      { actor: h, scale: 5 }
    );

    cfg = { cx: 14, cy: 2, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // set up our obstacle so that collision and touch make it play sounds
    cfg = { cx: 5, cy: 5, width: 0.8, height: 0.8, radius: 0.4, img: "purple_ball.png" };
    let o = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 1, friction: 1 }),
      role: new Obstacle(),
      sounds: new SoundEffectComponent({ collide: "high_pitch.ogg" })
    });

    let tapHandler = () => {
      stage.musicLibrary.getSound("low_pitch.ogg").play();
      return true;
    };
    o.gestures = { tap: tapHandler };

    welcomeMessage("Touch the purple ball or collide with it, and a " + "sound will play");
    winMessage("Great Job");
  }

  // this level shows simple animation. Every entity can have a default
  // animation.
  else if (level == 49) {
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
    // this hero will be animated:
    let animations = new Map();
    // This says that we spend 200 milliseconds on each of the images that are
    // listed, and then we repeat
    //
    // Note that "AnimationState.IDLE_E" is the default animation, and the only one that
    // is required.  it is both the default, and what to use for an Actor who
    // is facing to the right and standing still.
    animations.set(AnimationState.IDLE_E, AnimationSequence.makeSimple({ timePerFrame: 200, repeat: true, images: ["leg_star_1.png", "leg_star_2.png", "leg_star_3.png", "leg_star_4.png"] }));
    let h_cfg = {
      cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4,
      animations,
    };

    let h = Actor.Make({
      appearance: new AnimatedSprite(h_cfg),
      rigidBody: new CircleBody(h_cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });

    addJoystickControl(stage.hud, { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5, stopOnUp: true });

    welcomeMessage("The hero is animated");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level introduces jumping animations and shows how to make
  // "disappearance animations".  It also shows an odd way of moving the world.
  // There's friction on the floor, so the hero can only move by tilting while
  // the hero is in the air
  else if (level == 50) {
    // In this level, we will have tilt to move left/right, but there is so much
    // friction that tilt will only be effective when the hero is in the air
    stage.world.setGravity(0, 10);
    enableTilt(10, 0);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });

    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // The hero must reach this destination
    let cfg = { cx: 15, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // The hero has one animation when it is not in the air, another when it is
    // Note that "jump_right" will also be used when jumping to the left, if
    // there is no "jump_left"

    // this is the more complex form of animation... we show the
    // different cells for different lengths of time
    let idle_right = new AnimationSequence(true)
      .to("leg_star_1.png", 150)
      .to("leg_star_2.png", 200)
      .to("leg_star_3.png", 300)
      .to("leg_star_4.png", 350);
    // we can use the complex form to express the simpler animation, of course
    let jump_right = new AnimationSequence(true)
      .to("leg_star_4.png", 200)
      .to("leg_star_6.png", 200)
      .to("leg_star_7.png", 200)
      .to("leg_star_8.png", 200);
    let animations = new Map();
    animations.set(AnimationState.IDLE_E, idle_right);
    animations.set(AnimationState.JUMP_E, jump_right);
    // TODO: Why don't we need all of these?
    // animations.set(AnimationState.JUMP_NE, jump_right);
    // animations.set(AnimationState.JUMP_SE, jump_right);
    // animations.set(AnimationState.JUMP_W, jump_right);
    // animations.set(AnimationState.JUMP_NW, jump_right);
    // animations.set(AnimationState.JUMP_SW, jump_right);

    let h_cfg = { cx: 0.25, cy: 7, width: 0.8, height: 0.8, radius: 0.4, animations };
    let h = Actor.Make({
      appearance: new AnimatedSprite(h_cfg),
      rigidBody: new CircleBody(h_cfg, stage.world, { density: 5, friction: 0.6, disableRotation: true }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
    h.gestures = { tap: () => { (h.role as Hero).jump(0, -5); return true; } }

    // create a goodie that has a disappearance callback, which we can use to do
    // a disappearance animation. When the goodie is about to disappear, our
    // code will install a new actor as the disappearance animation.  That means
    // that we can make it have any size we want, but we need to offset it from
    // the (defunct) goodie's position. Note, too, that the final cell is blank,
    // so that we don't leave a residue on the screen.
    let g_animations = new Map();
    g_animations.set(AnimationState.IDLE_E, AnimationSequence.makeSimple({ timePerFrame: 1000, repeat: true, images: ["star_burst_3.png"] }));
    let g_cfg = { cx: 2, cy: 7.5, width: 0.5, height: 0.5, radius: 0.25, animations: g_animations };
    Actor.Make({
      appearance: new AnimatedSprite(g_cfg),
      rigidBody: new CircleBody(g_cfg, stage.world),
      role: new Goodie(),
      onDisappear: (a: Actor) => {
        let cx = (a.rigidBody.getCenter().x);
        let cy = (a.rigidBody.getCenter().y);
        let animations = new Map();
        animations.set(AnimationState.IDLE_E, new AnimationSequence(false).to("star_burst_3.png", 200).to("star_burst_2.png", 200).to("star_burst_1.png", 200).to("star_burst_4.png", 200));
        Actor.Make({
          appearance: new AnimatedSprite({ animations, width: .5, height: .5 }),
          rigidBody: new BoxBody({ cx, cy, width: .5, height: .5 }, stage.world, { collisionsEnabled: false }),
        })
      }
    });

    welcomeMessage("Press the hero to make it jump");
    winMessage("Great Job");
  }

  // this level shows that projectiles can be animated, and that we can
  // animate the hero while it throws a projectile
  else if (level == 51) {
    enableTilt(10, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // set up our hero
    let animations = new Map();
    animations.set(AnimationState.IDLE_E, AnimationSequence.makeSimple({ timePerFrame: 1000, repeat: true, images: ["color_star_1.png"] }));
    // set up an animation when the hero throws:
    animations.set(AnimationState.TOSS_E, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));
    animations.set(AnimationState.TOSS_NE, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));
    animations.set(AnimationState.TOSS_SE, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));
    animations.set(AnimationState.TOSS_W, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));
    animations.set(AnimationState.TOSS_NW, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));
    animations.set(AnimationState.TOSS_SW, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));
    animations.set(AnimationState.TOSS_N, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));
    animations.set(AnimationState.TOSS_S, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));

    animations.set(AnimationState.TOSS_IDLE_E, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));
    animations.set(AnimationState.TOSS_IDLE_NE, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));
    animations.set(AnimationState.TOSS_IDLE_SE, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));
    animations.set(AnimationState.TOSS_IDLE_W, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));
    animations.set(AnimationState.TOSS_IDLE_NW, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));
    animations.set(AnimationState.TOSS_IDLE_SW, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));
    animations.set(AnimationState.TOSS_IDLE_N, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));
    animations.set(AnimationState.TOSS_IDLE_S, new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400));

    let h_cfg = {
      cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, animations
    };
    let h = Actor.Make({
      appearance: new AnimatedSprite(h_cfg),
      rigidBody: new CircleBody(h_cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
    h.gestures = {
      tap: () => { (projectiles.get()?.role as (Projectile | undefined))?.tossFrom(h, .4, .4, 0, -3); return true; }
    };

    // make a projectile pool and give an animation pattern for the projectiles
    let projectiles = new ActorPoolSystem();
    let p_animations = new Map();
    p_animations.set(AnimationState.IDLE_E, AnimationSequence.makeSimple({ timePerFrame: 100, repeat: true, images: ["fly_star_1.png", "fly_star_2.png"] }));
    populateProjectilePool(projectiles, {
      size: 100,
      bodyMaker: () => new CircleBody({ radius: 0.25, cx: -100, cy: -100 }, stage.world),
      appearanceMaker: () => new AnimatedSprite({ width: 0.5, height: 0.5, animations: p_animations, z: 0 }),
      strength: 1,
      range: 40,
      disappearOnCollide: true,
      immuneToCollisions: true
    });
    welcomeMessage("Press the hero to make it throw a ball");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level explores invincibility animation. While we're at it, we
  // make some enemies that aren't affected by invincibility, and some
  // that can even damage the hero while it is invincible.
  else if (level == 52) {
    enableTilt(10, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 15, cy: 1, width: 0.5, height: 0.5, radius: 0.25, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // make an animated hero, and give it an invincibility animation
    let animations = new Map();
    animations.set(AnimationState.IDLE_E, new AnimationSequence(true)
      .to("color_star_1.png", 300)
      .to("color_star_2.png", 300)
      .to("color_star_3.png", 300)
      .to("color_star_4.png", 300));
    animations.set(AnimationState.INV_E, new AnimationSequence(true).to("color_star_5.png", 100).to("color_star_6.png", 100).to("color_star_7.png", 100).to("color_star_8.png", 100));
    animations.set(AnimationState.INV_SE, new AnimationSequence(true).to("color_star_5.png", 100).to("color_star_6.png", 100).to("color_star_7.png", 100).to("color_star_8.png", 100));
    animations.set(AnimationState.INV_NE, new AnimationSequence(true).to("color_star_5.png", 100).to("color_star_6.png", 100).to("color_star_7.png", 100).to("color_star_8.png", 100));
    animations.set(AnimationState.INV_W, new AnimationSequence(true).to("color_star_5.png", 100).to("color_star_6.png", 100).to("color_star_7.png", 100).to("color_star_8.png", 100));
    animations.set(AnimationState.INV_SW, new AnimationSequence(true).to("color_star_5.png", 100).to("color_star_6.png", 100).to("color_star_7.png", 100).to("color_star_8.png", 100));
    animations.set(AnimationState.INV_NW, new AnimationSequence(true).to("color_star_5.png", 100).to("color_star_6.png", 100).to("color_star_7.png", 100).to("color_star_8.png", 100));
    animations.set(AnimationState.INV_N, new AnimationSequence(true).to("color_star_5.png", 100).to("color_star_6.png", 100).to("color_star_7.png", 100).to("color_star_8.png", 100));
    animations.set(AnimationState.INV_S, new AnimationSequence(true).to("color_star_5.png", 100).to("color_star_6.png", 100).to("color_star_7.png", 100).to("color_star_8.png", 100));

    let h_cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "color_star_1.png", animations };
    Actor.Make({
      appearance: new AnimatedSprite(h_cfg),
      rigidBody: new CircleBody(h_cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // make some enemies
    for (let i = 0; i < 5; ++i) {
      cfg = { cx: 2 * i + 1, cy: 7, width: 0.8, height: 0.8, radius: 0.4, img: "red_ball.png" };

      // The first enemy we create will harm the hero even if the hero is
      // invincible
      let role: Enemy;
      let sounds: SoundEffectComponent | undefined = undefined;
      if (i == 0)
        role = new Enemy({ damage: 4, instantDefeat: true });
      // the second enemy will not be harmed by invincibility, but won't harm an
      // invincible hero
      else if (i == 1) {
        role = new Enemy({ damage: 4, immuneToInvincibility: true });
      }
      // The other enemies can be defeated by invincibility
      else {
        role = new Enemy({ disableHeroCollision: true, damage: 4, });
        sounds = new SoundEffectComponent({ defeat: "high_pitch.ogg" })
      }

      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world, { density: 1.0, elasticity: 0.3, friction: 0.6, rotationSpeed: 1 }),
        role,
        sounds,
      });

    }
    // neat trick: this enemy does zero damage, but is still annoying because it
    // slows the hero down.
    cfg = { cx: 12, cy: 7, width: 0.8, height: 0.8, radius: 0.4, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 10, elasticity: 0.3, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Enemy({ damage: 0 }),
    });

    // add a goodie that makes the hero invincible
    cfg = { cx: 15, cy: 7, width: 0.5, height: 0.5, radius: 0.25, img: "blue_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { rotationSpeed: .25 }),
      movement: new PathMovement(new Path().to(15, 7).to(5, 2).to(15, 7), 1, true),
      role: new Goodie({
        onCollect: (_g: Actor, h: Actor) => {
          (h.role as Hero).invincibleRemaining = (h.role as Hero).invincibleRemaining + 15;
          return true;
        }
      }),
    });

    makeText(stage.hud,
      { cx: 0.1, cy: 8.5, center: false, width: .1, height: .1, face: "Arial", color: "#3C46FF", size: 12, z: 2 },
      () => stage.score.getGoodieCount(0) + " Goodies");

    // draw a picture when the level is won, and don't print text...
    // this particular picture isn't very useful
    stage.score.winSceneBuilder = (overlay: Scene) => {
      addTapControl(
        overlay,
        { cx: 8, cy: 4.5, width: 16, height: 9, img: "fade.png" },
        () => { stage.switchTo(builder, level + 1); return true; }
      );
    };
    welcomeMessage("The blue ball will make you invincible for 15 seconds");
    loseMessage("Try Again");
  }

  // demonstrate crawl animation, and also show that with multi-touch, we can
  // "crawl" in the air while jumping.
  //
  // One thing you'll notice here is that if you're in crawl-jump and stop
  // crawling, the animation doesn't go back to jump.  If that matters to your
  // game, then States.ts is where you'll want to do some work.
  else if (level == 53) {
    stage.world.setGravity(0, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3 });

    let cfg = { cx: 15, cy: 8.5, width: 0.5, height: 0.5, radius: 0.25, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // make a hero with fixed velocity, and give it crawl and jump
    // animations
    let animations = new Map();
    animations.set(AnimationState.IDLE_E, AnimationSequence.makeSimple({ timePerFrame: 100, repeat: true, images: ["color_star_1.png", "color_star_2.png"] }));
    let jumping = new AnimationSequence(true).to("color_star_3.png", 200).to("color_star_4.png", 200).to("color_star_5.png", 200);
    animations.set(AnimationState.JUMP_E, jumping);
    animations.set(AnimationState.JUMP_NE, jumping);
    animations.set(AnimationState.JUMP_SE, jumping);
    animations.set(AnimationState.JUMP_IDLE_E, jumping);
    animations.set(AnimationState.JUMP_IDLE_NE, jumping);
    animations.set(AnimationState.JUMP_IDLE_SE, jumping);
    let crawling = new AnimationSequence(true).to("color_star_6.png", 100).to("color_star_7.png", 300).to("color_star_8.png", 300);
    animations.set(AnimationState.CRAWL_E, crawling);
    animations.set(AnimationState.CRAWL_NE, crawling);
    animations.set(AnimationState.CRAWL_SE, crawling);
    animations.set(AnimationState.CRAWL_IDLE_E, crawling);
    animations.set(AnimationState.CRAWL_IDLE_SE, crawling);
    animations.set(AnimationState.CRAWL_IDLE_NE, crawling);

    let boxCfg = { cx: 0, cy: 8, width: 0.75, height: 0.75, animations };
    let h = Actor.Make({
      appearance: new AnimatedSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { density: 5 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (h.movement as ManualMovement).addVelocity(2, 0);

    // stage.world.camera.setCameraFocus(h);

    // enable hero jumping and crawling
    addTapControl(stage.hud, { cx: 4, cy: 4.5, width: 8, height: 9, img: "" }, jumpAction(h, 0, -8, 0));
    addToggleButton(stage.hud,
      { cx: 12, cy: 4.5, width: 8, height: 9, img: "" },
      () => (h.role as Hero).crawlOn(Math.PI / 2),
      () => (h.role as Hero).crawlOff(Math.PI / 2)
    );

    // add an enemy we can defeat via crawling. It should be defeated even by a
    // "jump crawl"
    let eBoxCfg = { cx: 13, cy: 6.5, width: 1, height: 5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(eBoxCfg),
      rigidBody: new BoxBody(eBoxCfg, stage.world, { density: 5, elasticity: 0.3, friction: 0.6 }),
      role: new Enemy({ defeatByCrawl: true }),
    });

    // include a picture on the "try again" screen
    stage.score.loseSceneBuilder = (overlay: Scene) => {
      addTapControl(
        overlay,
        { cx: 8, cy: 4.5, width: 16, height: 9, img: "fade.png" },
        () => { stage.switchTo(builder, level); return true; }
      );
      makeText(overlay,
        { center: true, cx: 8, cy: 4.5, width: .1, height: .1, face: "Arial", color: "#FFFFFF", size: 28, z: 0 },
        () => "Oh well...");
    };

    welcomeMessage("Press the right side of the screen to crawl or the left side to jump.");
    winMessage("Great Job");
  }

  // This isn't quite the same as animation.  We can indicate that a hero's
  // image changes depending on its strength. This can, for example, allow a
  // hero to change (e.g., get healthier) by swapping through images as goodies
  // are collected, or allow the hero to switch its animation depending on how
  // many enemies it has collided with.
  else if (level == 54) {
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // create 7 goodies, each of which adds 1 to the hero's strength
    for (let i = 0; i < 7; ++i) {
      let cfg = { cx: 1 + i, cy: 1 + i, width: 0.5, height: 0.5, radius: 0.25, img: "blue_ball.png" };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world),
        role: new Goodie({
          onCollect: (_g: Actor, h: Actor) => {
            (h.role as Hero).strength = 1 + (h.role as Hero).strength;
            return true;
          }
        }),
      });
    }

    let cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // make 8 enemies, each with strength == 1, so we can test moving our strength all the
    // way up to 8 and back down again
    for (let i = 0; i < 8; ++i) {
      cfg = { cx: 2 + i, cy: 1 + i, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world),
        role: new Enemy({ damage: 1, disableHeroCollision: true }),
      });
    }

    cfg = { cx: 0, cy: 0, width: 0.8, height: 0.8, radius: 0.4, img: "color_star_1.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new ManualMovement(),
      role: new Hero({
        // provide some code to run when the hero's strength changes
        onStrengthChange: (actor: Actor) => {
          // get the hero's strength. Since the hero isn't dead, the
          // strength is at least 1. Since there are 7 strength
          // booster goodies, the strength is at most 8.
          let s = (actor.role as Hero).strength;
          // set the hero's image according to the strength
          (actor.appearance as ImageSprite).setImage("color_star_" + s + ".png");
        }
      }),
    });

    addJoystickControl(stage.hud, { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5, stopOnUp: true });
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
