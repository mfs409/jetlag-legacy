import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, FilledCircle, FilledPolygon } from "../jetlag/Components/Appearance";
import { TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody, PolygonBody } from "../jetlag/Components/RigidBody";
import { Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { GridSystem } from "../jetlag/Systems/Grid";

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

  // Here's where we name all the images/sounds/background music files.  Make
  // sure names don't have spaces or other funny characters, and make sure you
  // put the corresponding files in the folder identified by `resourcePrefix`.
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = [];
  imageNames = [];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(_level: number) {


  // Draw a joystick on the HUD, and have the joystick control the hero.  This
  // will appear as a grey circle in the bottom left corner of the screen.
  //
  // This "helper" code is pretty complicated, and even the arguments to it
  // might not make sense.  `game.hud` means that we want it on the HUD, not
  // in the place where gameplay happens.  The second argument is image/body
  // configuration for a rectangle that understands mouse/touch.  The third
  // part is how we say which actor the joystick controls.  The scale is
  // something that gets multiplied by the joystick value (you can use
  // fractions, negatives, etc).  Lastly, we'll say that when the player
  // releases the joystick, the actor should stop moving.
  addJoystickControl(stage.hud,
    { cx: 1, cy: 8, width: 1.5, height: 1.5, img: "grey_ball.png" },
    { actor: h, scale: 5, stopOnUp: true });

    // this level demonstrates that we can drag actors (in this case,
    // obstacles), and that we can make rotated obstacles. The latter could be
    // useful for having angled walls in a maze
    else if (level == 23) {
    // start with a hero who is controlled via tilt, and a destination
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    enableTilt(10, 10);
    let cfg = { cx: 0.25, cy: 5.25, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    cfg = { cx: 15, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // Create a "drag zone": a region on the HUD that accepts finger drag gestures
    createDragZone(stage.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" });

    // draw two obstacles that we can drag
    let boxCfg = { cx: 15, cy: 2, width: 0.75, height: 0.75, img: "purple_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { elasticity: 1 }),
      movement: new Draggable(true),
      role: new Obstacle(),
    });

    boxCfg = { cx: 14, cy: 1, width: 0.75, height: 0.75, img: "purple_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { elasticity: 1 }),
      movement: new Draggable(true),
      role: new Obstacle(),
    });

    // draw an obstacle that is oblong (due to its width and height) and that is rotated.
    // Note that this should be a box, or it will not have the right underlying shape.
    boxCfg = { cx: 3, cy: 3, width: 0.75, height: 0.15, img: "purple_ball.png" };
    let o = Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      // This one is draggable, but we pass in "false", so when the hero hits into
      // it, it will be affected.
      movement: new Draggable(false),
      role: new Obstacle(),
    });
    o.rigidBody.setRotation(Math.PI / 4);

    welcomeMessage("More obstacle tricks, including one that can be dragged");
    winMessage("Great Job");
  }

  // This level shows how we can use "poking" to move obstacles. In this case,
  // pressing an obstacle selects it, and pressing the screen moves the obstacle
  // to that location. Double-tapping an obstacle removes it.
  else if (level == 24) {
    // start with a hero who is controlled via Joystick, and a destination
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: .75, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new StandardMovement(),
      role: new Hero(),
    });

    cfg = { cx: 15, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // draw a picture on the -1 plane, so it is a background behind the hero and
    // destination
    Actor.Make({
      appearance: new ImageSprite({ width: 16, height: 9, img: "noise.png", z: -1 }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, stage.world, { collisionsEnabled: false }),
    });

    // make a few obstacles that we can poke
    let boxCfg = { cx: 14, cy: 1, width: 0.25, height: 2, img: "purple_ball.png" };
    let vertical_obstacle = Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { elasticity: 100 }),
      role: new Obstacle(),
    });

    // JetLag doesn't understand "double tap", so we implement it ourselves by
    // tracking each time a tap happens.
    let lastTouch = 0;
    // Track the actor most recently tapped
    let lastTapActor: Actor | undefined = undefined;
    // Now we can say what to do when the vertical obstacle is tapped:
    vertical_obstacle.gestures = {
      tap: () => {
        // Get the time of the last tap to the screen
        let x = stage.renderer.now;
        // If it's been less than 300 milliseconds, and if this is the second
        // consecutive tap to the vertical obstacle, remove it
        if (x - lastTouch < 300 && lastTapActor == vertical_obstacle) {
          vertical_obstacle.remove();
          return true;
        }
        // Otherwise, remember the time of the tap, and that it was to the
        // vertical obstacle
        lastTouch = x;
        lastTapActor = vertical_obstacle;
        // The poke-to-place zone is going to look for "selected_entity", so
        // make sure it is vertical_obstacle.
        stage.storage.setLevel("selected_entity", vertical_obstacle);
        return true;
      }
    };
    createPokeToPlaceZone(stage.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" });

    boxCfg = { cx: 14, cy: 2, width: 2, height: 0.25, img: "purple_ball.png" };
    let horizontal_obstacle = Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { elasticity: 100 }),
      role: new Obstacle(),
    });
    // We can write the code more succinctly the second time around...
    horizontal_obstacle.gestures = {
      tap: () => {
        let x = stage.renderer.now;
        if (x - lastTouch < 300 && lastTapActor == horizontal_obstacle) {
          horizontal_obstacle.remove();
          return true;
        }
        lastTouch = x;
        lastTapActor = horizontal_obstacle;
        stage.storage.setLevel("selected_entity", horizontal_obstacle);
        return true;
      }
    };

    // Note that we need to make the joystick *after* the pokeToPlaceZone,
    // or else our interaction with the zone will prevent the joystick from
    // working
    addJoystickControl(
      stage.hud,
      { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" },
      { actor: h, scale: 5 }
    );

    welcomeMessage("Touch an obstacle to select it, then touch the " + "screen to move it\n (double-touch to remove)");
    winMessage("Great Job");
  }

  // This level shows that we can draw on the screen to create obstacles.
  else if (level == 29) {
    // Set up a hero and destination, and turn on tilt
    let cfg = { cx: 8, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "leg_star_1.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });
    enableTilt(10, 10);
    cfg = { cx: 8, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // Here's a function that draws a purple ball at x,y
    let make = (hudCoords: { x: number, y: number }): boolean => {
      // Always convert the hud coordinates to world coordinates
      let pixels = overlayToWorldCoords(stage.hud, hudCoords.x, hudCoords.y);
      cfg = { cx: pixels.x, cy: pixels.y, radius: .25, width: .5, height: .5, img: "purple_ball.png" };
      let o = Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world, { elasticity: 2 }),
        role: new Obstacle(),
      });
      // Let's make it disappear quietly after 10 seconds...
      stage.world.timer.addEvent(new TimedEvent(10, false, () => o.remove()));
      return true;
    };
    // "Pan" means "drag", more or less.  It has three parts: the initial
    // down-press, the drag, and the release.  Let's say that whenever anyone
    // drags anywhere on the screen, we'll call "make"
    addPanCallbackControl(stage.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, make, make, make);
    welcomeMessage("Draw on the screen\nto make obstacles appear");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level shows that we can "flick" things to move them. Notice that we do
  // not enable tilt. Instead, we specified that there is a default gravity in
  // the Y dimension pushing everything down. This is much like gravity on
  // earth. The only way to move things, then, is by flicking them.
  else if (level == 30) {
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // This is new: we'll create a level with a constant force downward in the Y
    // dimension
    stage.world.setGravity(0, 10);

    // draw a destination
    let cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // create a hero that can be flicked
    cfg = { cx: 1, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6, disableRotation: true }),
      movement: new FlickMovement(1),
      role: new Hero(),
    });

    // A "flick zone" will receive swipe gestures and apply them directly to the
    // actor whose movement is "FlickMovement" and whose position is the start
    // point of the swipe.
    createFlickZone(stage.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" });

    // create an obstacle that can be flicked
    cfg = { cx: 6, cy: 6, width: 0.8, height: 0.8, radius: 0.4, img: "purple_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new FlickMovement(0.5),
      role: new Obstacle(),
    });

    welcomeMessage("Flick the hero to the destination");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level shows that we can make a hero move based on how we touch the
  // screen.  It also shows that we can use a set of images to animate the
  // appearance of an actor, instead of just using a single image.
  else if (level == 36) {
    stage.world.camera.setBounds(0, 0, 48, 9);
    drawBoundingBox(0, 0, 48, 9, .1, { density: 1, friction: 1 });
    // We do two new things here.  First, we provide animations in the hero's
    // configuration
    let animations = new Map();
    animations.set(AnimationState.IDLE_E, AnimationSequence.makeSimple({ timePerFrame: 200, repeat: true, images: ["leg_star_1.png", "leg_star_1.png"] }));
    animations.set(AnimationState.IDLE_W, AnimationSequence.makeSimple({ timePerFrame: 200, repeat: true, images: ["flip_leg_star_1.png", "flip_leg_star_1.png"] }));

    let h_cfg = {
      cx: .4, cy: .4, width: 0.8, height: 0.8, radius: 0.4, animations,
    };
    let h = Actor.Make({
      // Then, here, we make an *AnimatedSprite*, which uses that configuration.
      appearance: new AnimatedSprite(h_cfg),
      rigidBody: new CircleBody(h_cfg, stage.world, { density: 5, friction: 0.6, disableRotation: true }),
      movement: new StandardMovement(),
      role: new Hero(),
    });
    stage.world.camera.setCameraFocus(h);

    let cfg = { cx: 47, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // let's draw an enemy, just in case anyone wants to try to go to the bottom
    // right corner
    cfg = { cx: .5, cy: 8.5, radius: 0.5, width: 1, height: 1, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy(),
    });

    // draw some buttons for moving the hero.  These are "toggle" buttons: they
    // run some code when they are pressed, and other code when they are
    // released.
    addToggleButton(stage.hud, { cx: 1, cy: 4.5, width: 2, height: 5, img: "" }, () => (h.movement as StandardMovement).updateXVelocity(-5), () => (h.movement as StandardMovement).updateXVelocity(0));
    addToggleButton(stage.hud, { cx: 15, cy: 4.5, width: 2, height: 5, img: "" }, () => (h.movement as StandardMovement).updateXVelocity(5), () => (h.movement as StandardMovement).updateXVelocity(0));
    addToggleButton(stage.hud, { cx: 8, cy: 8, width: 12, height: 2, img: "" }, () => (h.movement as StandardMovement).updateYVelocity(5), () => (h.movement as StandardMovement).updateYVelocity(0));
    addToggleButton(stage.hud, { cx: 8, cy: 1, width: 12, height: 2, img: "" }, () => (h.movement as StandardMovement).updateYVelocity(-5), () => (h.movement as StandardMovement).updateYVelocity(0));
    // One thing you'll notice about these buttons is that unexpected things
    // happen if you slide your finger off of them.  Be sure to try to do things
    // like that when testing your code.  Maybe you'll decide you like the
    // unexpected behavior.  Maybe you'll decide that you need to make changes
    // to JetLag to fix the problem :)

    welcomeMessage("Press screen borders to move the hero");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // We can make a hero start moving only when it is pressed. This can even let
  // the hero hover until it is pressed. We could also use this to have a game
  // where the player puts obstacles in place, then starts the hero moving.
  else if (level == 39) {
    stage.world.setGravity(0, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1 });
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });
    let cfg = { cx: 15, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // make a hero who doesn't start moving until it is touched
    let boxCfg = { cx: 0, cy: 8.25, width: 0.75, height: 0.75, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { density: 1, friction: 0, disableRotation: true }),
      movement: new StandardMovement(),
      role: new Hero(),
    });
    stage.world.camera.setCameraFocus(h);

    setTouchAndGo(h, 5, 0);

    welcomeMessage("Press the hero to start moving");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // We can make a hero hover, and then have it stop hovering when it is flicked
  // or moved. This demonstrates the effect via flick. It also shows that an
  // enemy (or obstacle/goodie/destination) can fall due to gravity.
  else if (level == 66) {
    stage.world.setGravity(0, 10);
    welcomeMessage("Flick the hero into the destination");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let boxCfg = { cx: 1, cy: 7, width: 1, height: 1, radius: 0.5, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      movement: new HoverFlick(1, 7, 0.7),
      role: new Hero(),
    });
    createFlickZone(stage.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" });

    // place an enemy, let it fall
    let cfg = { cx: 15, cy: 1, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      movement: new GravityMovement(),
      role: new Enemy(),
    });

    // A destination.  You might need to flick the hero *while it's in the air*
    // to reach the destination
    cfg = { cx: 4, cy: 1, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
  }

  // In level 24, we poked an actor, then poked the screen, and the actor
  // teleported.  Here, we'll say that when we poke the screen, the actor starts
  // moving toward that point.
  else if (level == 69) {
    drawBoundingBox(0, 0, 16, 9, .1);
    welcomeMessage("Poke the hero, then  where you want it to go.");
    winMessage("Great Job");
    loseMessage("Try Again");

    // Let's set up a hero
    let animations = new Map();
    let r = AnimationSequence.makeSimple({ timePerFrame: 200, repeat: true, images: ["leg_star_1.png", "leg_star_1.png"] });
    animations.set(AnimationState.IDLE_E, r);
    let l = AnimationSequence.makeSimple({ timePerFrame: 200, repeat: true, images: ["flip_leg_star_8.png", "flip_leg_star_8.png"] });
    animations.set(AnimationState.IDLE_W, l);
    animations.set(AnimationState.IDLE_NW, l);
    animations.set(AnimationState.IDLE_SW, l);
    animations.set(AnimationState.WALK_W, l);
    animations.set(AnimationState.WALK_SW, l);
    animations.set(AnimationState.WALK_NW, l);
    let h_cfg = {
      cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, animations
    };
    let h = Actor.Make({
      appearance: new AnimatedSprite(h_cfg),
      rigidBody: new CircleBody(h_cfg, stage.world),
      movement: new PathMovement(new Path().to(.25, 5.25).to(.25, 5.25), 1, false),
      role: new Hero(),
    });

    // Like in poke-to-place, we need to "select" the entity with an initial tap
    h.gestures = { tap: () => { stage.storage.setLevel("selected_entity", h); return true; } };
    // The "false" means that we don't have to poke hero, poke location, poke
    // hero, poke location, ... Instead, we can poke hero, poke location, poke
    // location, ...
    //
    // Be sure to move left/right/up/down, to see if the animations are working
    createPokeToMoveZone(stage.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, 5, false);

    let cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // sometimes a control needs to have a large touchable area, but a small
    // image. One way to do it is to make an invisible control, then put a
    // picture on top of it. If you need that, see level 25 for a way to draw
    // pictures on the HUD.
  }

  // We can have a control that increases the hero's speed while pressed,
  // and decreases it upon release
  else if (level == 74) {
    stage.world.setGravity(0, 10);
    welcomeMessage("Press anywhere to speed up");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 64, 9, .1, { density: 1 });

    let cfg = { cx: 63, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    let boxCfg = { cx: 2, cy: 4, width: 0.75, height: 1.5, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { density: 1, friction: 0, disableRotation: true }),
      movement: new StandardMovement(),
      role: new Hero(),
    });
    // give the hero a fixed velocity
    (h.movement as StandardMovement).addVelocity(4, 0);

    // center the camera a little ahead of the hero
    stage.world.camera.setCameraFocus(h, 5, 0);
    stage.world.camera.setBounds(0, 0, 64, 9);

    // set up the background
    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // draw a turbo boost button that covers the whole screen... make sure its
    // "up" speed matches the hero velocity
    addToggleButton(stage.hud,
      { cx: 8, cy: 4.5, width: 16, height: 9, img: "" },
      () => (h.movement as StandardMovement).updateVelocity(15, 0),
      () => (h.movement as StandardMovement).updateVelocity(4, 0)
    );
  }

  // This level fleshes out some more poke-to-move stuff. Now we'll say
  // that once a hero starts moving, the player must re-poke the hero
  // before it can be given a new position. Also, the hero will keep
  // moving after the screen is released. We will also show the Fact
  // interface.
  else if (level == 77) {
    drawBoundingBox(0, 0, 16, 9, .1);
    welcomeMessage("Poke the hero, then  where you want it to go.");
    winMessage("Great Job");
    loseMessage("Try Again");

    let w = AnimationSequence.makeSimple({ timePerFrame: 200, repeat: true, images: ["flip_leg_star_8.png", "flip_leg_star_8.png"] });
    let animations = new Map();
    // TODO:  AnimatedSprite::getAnimationState is rather lackluster right now,
    //        leading to a lot of redundancy in these situations.  Consider
    //        something better?
    animations.set(AnimationState.IDLE_E, AnimationSequence.makeSimple({ timePerFrame: 200, repeat: true, images: ["leg_star_1.png", "leg_star_1.png"] }));
    animations.set(AnimationState.IDLE_W, w);
    animations.set(AnimationState.IDLE_NW, w);
    animations.set(AnimationState.IDLE_SW, w);
    animations.set(AnimationState.WALK_W, w);
    animations.set(AnimationState.WALK_SW, w);
    animations.set(AnimationState.WALK_NW, w);

    let h_cfg = {
      cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, animations,
    };
    let h = Actor.Make({
      appearance: new AnimatedSprite(h_cfg),
      rigidBody: new CircleBody(h_cfg, stage.world, { density: 1, friction: 0.5 }),
      movement: new StandardMovement(),
      role: new Hero(),
    });

    h.gestures = { tap: () => { stage.storage.setLevel("selected_entity", h); return true; } };
    // Be sure to change to "false" and see what happens
    createPokeToRunZone(stage.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, 5, true);

    let cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // We've actually done a few things with "facts" already, but now it's time
    // to discuss them in more detail.
    //
    // JetLag has three kinds of "facts"... level, session, and persistent.  A
    // level fact resets to "undefined" every time you restart the level (by
    // dying, going back to the menu, etc).  A session fact resets to
    // "undefined" every time you refresh the page or close and re-open the
    // browser.  Persistent facts never get reset after you set them, unless you
    // set them to undefined.
    //
    // To test it out, we have three facts (all are just numbers).  You can
    // press the buttons to increment the numbers.  Then exit the level or
    // refresh the page, and watch what happens.
    makeText(stage.hud,
      { cx: 1.25, cy: 0.5, center: false, width: .1, height: .1, face: "Arial", color: "#000000", size: 24, z: 2 },
      () => "Level: " + (stage.storage.getLevel("level test") ?? -1));
    makeText(stage.hud,
      { cx: 1.25, cy: 1, center: false, width: .1, height: .1, face: "Arial", color: "#000000", size: 24, z: 2 },
      () => "Session: " + (stage.storage.getSession("session test") ?? -1));
    makeText(stage.hud,
      { cx: 1.25, cy: 1.5, center: false, width: .1, height: .1, face: "Arial", color: "#000000", size: 24, z: 2 },
      () => "Game: " + (stage.storage.getPersistent("game test") ?? "-1"));

    addTapControl(stage.hud,
      { cx: .5, cy: 0.65, width: 0.5, height: 0.5, img: "red_ball.png" },
      () => {
        stage.storage.setLevel("level test", "" + (1 + parseInt(stage.storage.getLevel("level test") ?? -1)));
        return true;
      }
    );
    addTapControl(stage.hud,
      { cx: .5, cy: 1.15, width: 0.5, height: 0.5, img: "blue_ball.png" },
      () => {
        stage.storage.setSession("session test", "" + (1 + parseInt(stage.storage.getSession("session test") ?? -1)));
        return true;
      }
    );
    addTapControl(stage.hud,
      { cx: .5, cy: 1.65, width: 0.5, height: 0.5, img: "green_ball.png" },
      () => {
        stage.storage.setPersistent("game test", "" + (1 + parseInt(stage.storage.getPersistent("game test") ?? "-1")));
        return true;
      }
    );
  }

  // Demonstrate one-time callback controls
  else if (level == 82) {
    // start by setting everything up just like in level 1
    enableTilt(10, 10);
    let cfg = { cx: 2, cy: 3, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
    winMessage("Great Job");
    drawBoundingBox(0, 0, 16, 9, .1);
    welcomeMessage("Reach the destination\nto win this level");

    // add a pause button
    let hasPaused = false;
    let pause_button = addTapControl(stage.hud,
      { cx: 0.3, cy: 0.3, width: 0.5, height: 0.5, img: "pause.png" },
      () => {
        if (hasPaused) return false;
        hasPaused = true;
        stage.requestOverlay((overlay: Scene) => {
          addTapControl(overlay,
            { cx: 8, cy: 4.5, width: 16, height: 9, fillColor: "#000000" },
            () => { stage.clearOverlay(); return true; }
          );
          makeText(overlay,
            { center: true, cx: 8, cy: 4.5, width: .1, height: .1, face: "Arial", color: "#FFFFFF", size: 20, z: 0 },
            () => "you can only pause once...");
        }, false);
        // When the pause button draws the pause screen, it also disables the
        // pause button, so there can be no more pausing...
        pause_button.enabled = false;
        return true;
      }
    );
  }

  // It is possible for a button to control many Actors at once!
  else if (level == 86) {
    stage.world.setGravity(0, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { elasticity: 1, friction: 0.1 });
    welcomeMessage("Keep pressing until a hero makes it to the destination");
    winMessage("Great Job");
    loseMessage("Try Again");

    // We're going to make a bunch of heroes, and save them in the "heroes"
    // array
    let heroes: Actor[] = [];
    for (let i = 0; i < 16; ++i) {
      let boxCfg = { cx: i + 0.2, cy: 8, width: 0.25, height: 0.25, img: "green_ball.png" };
      let h = Actor.Make({
        appearance: new ImageSprite(boxCfg),
        rigidBody: new BoxBody(boxCfg, stage.world, { density: 1, elasticity: 1, friction: 5 }),
        movement: new StandardMovement(),
        role: new Hero(),
      });
      heroes.push(h);
    }

    // Here's a destination.  We need one hero to reach it
    let cfg = { cx: 7.5, cy: 0.25, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // Tapping this button will make all the heroes bounce a bit
    addTapControl(stage.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, () => {
      for (let h of heroes) {
        // The bounce is a bit chaotic in the x dimension, but always upward.
        (h.movement as StandardMovement).setAbsoluteVelocity(5 - getRandom(10), -3);
      }
      return true;
    });
  }

}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
