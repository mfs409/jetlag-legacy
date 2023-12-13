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


    // Tilt can be used to directly set an Actor's velocity, instead of applying
    // forces to the Actor.  This technique doesn't always work well, but it's a
    // nice option to have, so let's try it out.
    else if (level == 6) {
    // To turn on "tilt as velocity", all we need to do is pass in an extra
    // "true" to "enableTilt"
    enableTilt(10, 10, true);

    // The rest of this level should be pretty familiar by now :)
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    welcomeMessage("Tilt can change velocity, instead of\n" + "applying a force to actors.");
    winMessage("Great Job");

    let cfg = { cx: 4, cy: 7, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    cfg = { cx: 15, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
  }

  // This level also puts an enemy on a path, but now the path has three
  // points, so that the enemy returns to its starting point
  else if (level == 9) {
    // Just about everything in this level is the same as the previous level :)
    enableTilt(10, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 4, cy: 7, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { friction: .3 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    cfg = { cx: 15, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
    welcomeMessage("Avoid the enemy and\nreach the destination");

    // Notice how the Enemy path has 3 points, so that it travels back and
    // forth, and the points keep it on screen.  Paths can be made extremely
    // complex.  Be sure to try a lot of variations.
    cfg = { cx: 14, cy: 8.6, radius: 0.4, width: 0.8, height: 0.8, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      movement: new PathMovement(new Path().to(14, 8.6).to(12, 0.4).to(14, 8.6), 4, true),
      role: new Enemy(),
    });

    // This is extra, for testing skip_to and waypoint callbacks
    let e2 = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      movement: new PathMovement(new Path().to(14, 8.6).to(12, 0.4).to(14, 8.6), 4, true
        , (which: number) => console.log(which)
      ),
      role: new Enemy(),
    });
    (e2.movement as PathMovement).skip_to(1);

    loseMessage("Try Again");
    winMessage("Great Job");
  }

  // In general, if you can do something to one kind of Actor, you can do it to
  // all the kinds of actors.  In this level, we'll use Tilt to control the
  // enemy, too.  We'll also see that we can make actors rotate.
  else if (level == 10) {
    // So far, we've set up all our levels like this:
    enableTilt(10, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 4, cy: 7, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { friction: .3 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    cfg = { cx: 15, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      // If we want to make something rotate, we can do it like this.  The ".5"
      // means one rotation per second
      rigidBody: new CircleBody(cfg, stage.world, { rotationSpeed: .5 }),
      role: new Destination(),
    });


    // Make an enemy who moves due to tilt
    cfg = { cx: 14, cy: 1.5, radius: 0.4, width: 0.8, height: 0.8, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, elasticity: 0.3, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Enemy(),
    });

    // Play some music
    stage.levelMusic = new MusicComponent(stage.musicLibrary.getMusic("tune.ogg"));

    stage.score.setVictoryDestination(1);
    winMessage("Great Job");
    loseMessage("Better luck next time...");
    welcomeMessage("The enemy is also controlled by tilt.");
  }

  // The previous level had a weird visual glitch: when the green ball hit a
  // wall, it just sort of glided along, instead of rolling.  We'll add some
  // density/elasticity/friction to the ball and walls, so we get a nicer
  // behavior.
  if (level == 3) {
    enableTilt(10, 10);
    let cfg = { cx: 2, cy: 3, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
    // In the next line, we can give some additional configuration to the hero's
    // circle.  It's dense, so it's going to move slowly.  It has friction, so
    // if it collides with something that also has friction, good things will
    // happen :)

    // notice that when we want to change cfg, we don't put a "let" in front
    cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
    winMessage("You made it!");

    // Assign some density, elasticity, and friction to the bounding box.
    //
    // Note:  You should see what happens when you change these numbers.
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 0.9 });

    // This welcome message is also a good reminder: when you're testing a game,
    // don't just try to win... test out all the behaviors that you expect, even
    // ones related to losing, going to wrong way, etc.
    welcomeMessage("When the hero hits a wall at an angle, the hero should spin");
  }

  // The previous level had a weird visual glitch: when the green ball hit a
  // wall, it just sort of glided along, instead of rolling.  We'll add some
  // density/elasticity/friction to the ball and walls, so we get a nicer
  // behavior.
  if (level == 3) {
    enableTilt(10, 10);
    let cfg = { cx: 2, cy: 3, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
    // In the next line, we can give some additional configuration to the hero's
    // circle.  It's dense, so it's going to move slowly.  It has friction, so
    // if it collides with something that also has friction, good things will
    // happen :)

    // notice that when we want to change cfg, we don't put a "let" in front
    cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
    winMessage("You made it!");

    // Assign some density, elasticity, and friction to the bounding box.
    //
    // Note:  You should see what happens when you change these numbers.
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 0.9 });

    // This welcome message is also a good reminder: when you're testing a game,
    // don't just try to win... test out all the behaviors that you expect, even
    // ones related to losing, going to wrong way, etc.
    welcomeMessage("When the hero hits a wall at an angle, the hero should spin");
  }

  // This level explores a bit more of what we can do with enemies, by having
  // an enemy that moves along a fixed path.  Note that every actor can move
  // along a fixed path, not just enemies.
  if (level == 8) {
    // Let's set up everything except the enemy, just like in the previous level
    enableTilt(10, 10);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 4, cy: 7, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { friction: .3 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    cfg = { cx: 15, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
    welcomeMessage("Avoid the enemy and\nreach the destination");

    // This time, we'll make an enemy and attach a path to it.
    //
    // The path will have two points, which I based on the radius so that the
    // enemy starts completely below the screen, and keeps going upward until
    // it's completely off the top of the screen. Note what happens when the
    // path repeats: we never say "there is a third point that is the same as
    // the start point", so the enemy teleports back to the starting point after
    // it reaches (14, -0.4).
    cfg = { cx: 14, cy: 9.4, radius: 0.4, width: 0.8, height: 0.8, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      movement: new PathMovement(new Path().to(14, 9.4).to(14, -0.4), 4, true),
      role: new Enemy(),
    });
    // This is the third kind of movement we've seen.  The first was Tilt.  The
    // second was "no movement".


    // Note that if we don't use winMessage() and loseMessage(), then when the
    // player wins or loses, gameplay will immediately (re)start at the
    // appropriate level. Be sure to test it out by losing *and* winning.
  }

  // This level plays around with physics a little bit, to show how friction and
  // elasticity can do interesting things.
  //
  // It also does some new tricks with the welcome scene overlay
  else if (level == 13) {
    // Put a border around the level, and create a hero and destination.  Control the hero
    // with a joystick
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 1, cy: 5, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new StandardMovement(),
      role: new Hero(),
    });

    cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // note: releasing the joystick no longer stops the hero
    addJoystickControl(stage.hud, { cx: 1, cy: 8, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5, stopOnUp: false });

    // These obstacles have interesting elasticity and friction values
    cfg = { cx: 4, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "purple_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { elasticity: 100 }),
      role: new Obstacle(),
    });

    cfg = { cx: 4, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "purple_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 10, friction: 100 }),
      role: new Obstacle(),
    });

    winMessage("Great Job");

    // On this welcome scene, we will have multiple texts, with different font
    // colors.  We will also have an image.  Lastly, the scene won't
    // disappear by clicking.  Instead, it will disappear after a few
    // seconds.  Note that the timer for dismissing is a callback within a
    // callback
    stage.requestOverlay((overlay: Scene) => {
      let opts = { cx: 8, cy: 4.5, width: 16, height: 9, fillColor: "#000000" };
      Actor.Make({
        appearance: new FilledBox(opts),
        rigidBody: new BoxBody(opts, overlay),
      });
      makeText(overlay,
        { center: true, cx: 8, cy: 4.5, width: .1, height: .1, face: "Arial", color: "#FFFFFF", size: 28, z: 0 },
        () => "Obstacles can have different amounts\nof friction and elasticity");
      makeText(overlay,
        { cx: 0.5, cy: 0.5, center: false, width: .1, height: .1, face: "Arial", color: "#00FFFF", size: 16, z: 0 },
        () => "(Releasing the joystick does not stop the hero anymore)");
      overlay.timer.addEvent(new TimedEvent(4, false, () => stage.clearOverlay()));
    }, false);
  }

  // Earlier, we saw that enemies could move along a path. So can any other
  // actor, so we'll move destinations, goodies, and obstacles, too.
  else if (level == 15) {
    // start with a hero who is controlled via Joystick
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 1, cy: 3, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new StandardMovement(),
      role: new Hero(),
    });

    addJoystickControl(stage.hud, { cx: 1, cy: 8, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5 });

    // make a destination that moves, and that requires one goodie to be collected before it
    // works
    cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      movement: new PathMovement(new Path().to(15, 8).to(15, 0.25).to(15, 8), 4, true),
      role: new Destination({ onAttemptArrival: () => { return stage.score.getGoodieCount(0) >= 1; } }),
    });
    stage.score.setVictoryDestination(1);

    // make an obstacle that moves
    let boxCfg = { cx: 0, cy: 0, width: 1, height: 1, img: "purple_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { elasticity: 100 }),
      movement: new PathMovement(new Path().to(0, 0).to(8, 8).to(0, 0), 2, true),
      role: new Obstacle(),
    });

    // make a goodie that moves
    cfg = { cx: 5, cy: 5, radius: 0.25, width: 0.5, height: 0.5, img: "blue_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      movement: new PathMovement(new Path().to(3, 3).to(6, 3).to(6, 6).to(3, 6).to(3, 3), 10, true),
      role: new Goodie(),
    });

    // draw a goodie counter in light blue (60, 70, 255) with a 12-point font
    makeText(stage.hud,
      { cx: 1, cy: 1, center: false, width: .1, height: .1, face: "Arial", color: "#3C46FF", size: 12, z: 2 },
      () => stage.score.getGoodieCount(0) + " Goodies");

    welcomeMessage("Every actor can move...");
    winMessage("Great Job");
  }

  // Only rotation in this next one, rest in gestures:
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


  // In this level, the enemy chases the hero
  else if (level == 25) {
    // start with a hero who is controlled via Joystick, and a destination
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new StandardMovement(),
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

    // draw a picture late within this block of code, but still cause the picture to be
    // drawn behind everything else by giving it a z index of -2
    Actor.Make({
      appearance: new ImageSprite({ width: 16, height: 9, img: "noise.png", z: -2 }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, stage.world, { collisionsEnabled: false }),
    });

    // create an enemy who chases the hero
    // Note: z is -2, but it was drawn after the noise, so we can still see it
    let zCfg = { z: -2, cx: 15, cy: 1, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png", };
    Actor.Make({
      appearance: new ImageSprite(zCfg),
      rigidBody: new CircleBody(zCfg, stage.world, { density: 0.1, elasticity: 0.3, friction: 0.6 }),
      movement: new BasicChase(1, h, true, true),
      role: new Enemy(),
    });

    welcomeMessage("The enemy will chase you");
    winMessage("Good Job");
    loseMessage("Try Again");
  }

  // This hero rotates so that it faces in the direction of movement. This can
  // be useful in games where the perspective is from overhead, and the hero is
  // moving in any X or Y direction
  else if (level == 27) {
    // set up a hero who rotates in the direction of movement, and is controlled by joystick
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "leg_star_1.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new StandardMovement({ rotateByDirection: true }),
      role: new Hero(),
    });

    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });
    addJoystickControl(stage.hud,
      { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" },
      { actor: h, scale: 5 }
    );

    // We won't add a destination... instead, the level will end in victory after 25 seconds
    stage.score.setWinCountdownRemaining(25);
    makeText(stage.hud,
      { cx: 0.1, cy: 8.5, center: false, width: .1, height: .1, face: "Arial", color: "#000000", size: 32, z: 2 }, () =>
      (stage.score.getWinCountdownRemaining() ?? 0).toFixed(0));

    // Let's have an enemy, too
    cfg = { cx: 8, cy: 4.5, radius: 1, width: 2, height: 2, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy(),
    });

    welcomeMessage("The star rotates in the direction of movement");
    winMessage("You Survived!");
    loseMessage("Try Again");
  }

  // This level shows two things. The first is that a custom motion path can
  // allow things to violate the laws of physics and pass through other things.
  // The second is that motion paths can go off-screen.
  else if (level == 28) {
    // set up a hero who rotates in the direction of movement, and is controlled by joystick
    let cfg = { cx: 8, cy: 4.25, width: 0.8, height: 0.8, radius: 0.4, img: "leg_star_1.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new StandardMovement({ rotateByDirection: true }),
      role: new Hero(),
    });

    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });
    addJoystickControl(stage.hud,
      { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" },
      { actor: h, scale: 5 }
    );

    // the destination is right below the hero
    cfg = { cx: 8, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // this enemy starts from off-screen... you've got to be quick to survive!
    cfg = { cx: 8, cy: -8, radius: 4, width: 8, height: 8, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      movement: new PathMovement(new Path().to(8, -8).to(8, 4.5).to(8, -8), 6, true),
      role: new Enemy(),
    });

    welcomeMessage("Reach the destination to win the level.");
    winMessage("Great Job");
    loseMessage("Ha Ha Ha");
  }

  // In the last level, we had complete control of the hero's movement.  Here,
  // we give the hero a fixed velocity, and only control its up/down movement.
  else if (level == 37) {
    stage.world.camera.setBounds(0, 0, 48, 9);
    drawBoundingBox(0, 0, 48, 9, .1, { density: 1 });
    let cfg = { cx: 47, cy: 8, radius: 0.5, width: 1, height: 1, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);
    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });
    cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0, disableRotation: true }),
      movement: new StandardMovement(),
      role: new Hero(),
    });
    (h.movement as StandardMovement).addVelocity(5, 0);

    stage.world.camera.setCameraFocus(h);

    // draw an enemy to avoid, and one at the end
    cfg = { cx: 30, cy: 6, radius: 0.5, width: 1, height: 1, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Enemy(),
    });

    let boxCfg = { cx: 47.9, cy: 4.5, width: 0.1, height: 9, img: "" };
    Actor.Make({
      appearance: new ImageSprite(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      role: new Enemy(),
    });

    // draw the up/down controls that cover the whole screen
    addToggleButton(stage.hud, { cx: 8, cy: 2.25, width: 16, height: 4.5, img: "" }, () => (h.movement as StandardMovement).updateYVelocity(-5), () => (h.movement as StandardMovement).updateYVelocity(0));
    addToggleButton(stage.hud, { cx: 8, cy: 6.75, width: 16, height: 4.5, img: "" }, () => (h.movement as StandardMovement).updateYVelocity(5), () => (h.movement as StandardMovement).updateYVelocity(0));

    welcomeMessage("Press screen borders\nto move up and down");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level shows that we can make entities that shrink or grow over time.
  else if (level == 56) {
    // Negative gravity... the hero is going to float upward!
    stage.world.setGravity(0, -10);
    enableTilt(10, 0);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // Make a hero who is blocked from moving upward by a shrinking ceiling
    let cfg = { cx: 2, cy: 2, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    let boxCfg = { cx: 1, cy: 1, width: 8, height: 1, fillColor: "#FF0000" };
    let ceiling = Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      role: new Obstacle(),
    });

    setShrinkOverTime(ceiling, 0.1, 0.1, true);

    // make an obstacle that causes the hero to throw Projectiles when touched
    //
    // It might seem silly to use an obstacle instead of something on the HUD,
    // but it's good to realize that all these different behaviors are really
    // the same.
    cfg = { cx: 15, cy: 2, width: 1, height: 1, radius: 0.5, img: "purple_ball.png" };
    let o = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { collisionsEnabled: false }),
      role: new Obstacle(),
    });
    o.gestures = {
      tap: () => { (projectiles.get()?.role as (Projectile | undefined))?.tossFrom(h, .125, .75, 0, 15); return true; }
    };

    // set up our projectiles.  There are only 20... throw them carefully
    let projectiles = new ActorPoolSystem();
    populateProjectilePool(projectiles, {
      size: 3, strength: 2,
      bodyMaker: () => new CircleBody({ radius: 0.25, cx: -100, cy: -100 }, stage.world),
      disappearOnCollide: true,
      range: 40,
      immuneToCollisions: true,
      appearanceMaker: () => new ImageSprite({ img: "color_star_1.png", width: 0.5, height: 0.5, z: 0 }),
      randomImageSources: ["color_star_1.png", "color_star_2.png", "color_star_3.png", "color_star_4.png"]
    });
    projectiles.setLimit(20);

    // show how many shots are left
    makeText(stage.hud,
      { cx: 0.5, cy: 8.5, center: false, width: .1, height: .1, face: "Arial", color: "#FF00FF", size: 12, z: 2 },
      () => projectiles.getRemaining() + " projectiles left");

    // draw a bunch of enemies to defeat
    cfg = { cx: 4, cy: 5, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 1.0, elasticity: 0.3, friction: 0.6, rotationSpeed: 1 }),
      role: new Enemy(),
    });

    for (let i = 1; i < 20; i += 5) {
      cfg = { cx: 1 + i / 2, cy: 7, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
      Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: new CircleBody(cfg, stage.world),
        role: new Enemy(),
      });
    }

    // draw a few obstacles that shrink over time, to show that circles and
    // boxes work, we can shrink the X and Y rates independently, and we can opt
    // to center things as they shrink or grow
    // TODO:  Some of these don't work nicely
    boxCfg = { cx: 2, cy: 8, width: 1, height: 1, fillColor: "#FF0000" };
    let grow_box = Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world),
      role: new Obstacle(),
    });
    setShrinkOverTime(grow_box, -1, 0, false);

    cfg = { cx: 3, cy: 7, width: 1, height: 1, radius: 0.5, img: "purple_ball.png" };
    let small_shrink_ball = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Obstacle(),
    });
    setShrinkOverTime(small_shrink_ball, 0.1, 0.2, true);

    cfg = { cx: 11, cy: 6, radius: 1, width: 2, height: 2, img: "purple_ball.png" };
    let big_shrink_ball = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Obstacle(),
    });
    setShrinkOverTime(big_shrink_ball, 0.2, 0.1, false);

    // Hmm, this shrinks in just one time step?
    let cfg1 = { cx: 5, cy: 6, vertices: [-1, -1, 0, 1, -1, 1], fillColor: "#0A0305" };
    let shrink_poly = Actor.Make({
      appearance: new FilledPolygon(cfg1),
      rigidBody: new PolygonBody(cfg1, stage.world),
      role: new Obstacle(),
    });
    setShrinkOverTime(shrink_poly, 0.2, 0.1, false);

    let cfg2 = { cx: 7, cy: 6, width: 2, height: 2, fillColor: "#F0F0F0" };
    let shrink_box = Actor.Make({
      appearance: new FilledBox(cfg2),
      rigidBody: new BoxBody(cfg2, stage.world),
      role: new Obstacle(),
    });
    setShrinkOverTime(shrink_box, 0.2, 0.1, false);

    let cfg3 = { cx: 9, cy: 6, radius: 1, fillColor: "#0044F0" };
    let shrink_circle = Actor.Make({
      appearance: new FilledCircle(cfg3),
      rigidBody: new CircleBody(cfg3, stage.world),
      role: new Obstacle(),
    });
    setShrinkOverTime(shrink_circle, 0.2, 0.1, false);

    // Oh no, this shrinks way too fast, and the rigid body is really weird
    let cfg4 = { center: false, width: .1, height: .1, cx: 11, cy: 6, face: "Arial", color: "#FF0000", size: 32 };
    let shrink_text = Actor.Make({
      appearance: new TextSprite(cfg4, "Hello"),
      rigidBody: new BoxBody(cfg4, stage.world),
      role: new Obstacle(),
    });
    setShrinkOverTime(shrink_text, 0.02, 0.01, false);

    stage.score.setVictoryEnemyCount(5);

    // This level makes an interesting point... what do you do if you run out of
    // projectiles?  How can we say "start over"?  There are a few ways that
    // would work... what can you come up with?

    welcomeMessage("Actors can shrink and grow\n\n" + "(Be sure to disable debug boxes in GameConfig.java)");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // this level shows that we can make a hero in the air rotate. Rotation
  // doesn't do anything, but it looks nice...
  else if (level == 57) {
    stage.world.setGravity(0, 10);
    enableTilt(10, 0);
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    welcomeMessage("Press to rotate the hero");
    winMessage("Great Job");
    loseMessage("Try Again");

    let cfg = { cx: 15, cy: 4, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // make the hero jump on tap, so that we can see it spin in the air
    cfg = { cx: 4, cy: 8, width: 0.5, height: 0.5, radius: 0.25, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 1, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    // add buttons for rotating the hero
    addToggleButton(stage.hud,
      { cx: 4, cy: 4.5, width: 8, height: 9, img: "" },
      () => (h.role as Hero).increaseRotation(-0.05),
      () => (h.role as Hero).increaseRotation(-0.05)
    );
    addToggleButton(stage.hud,
      { cx: 12, cy: 4.5, width: 8, height: 9, img: "" },
      () => (h.role as Hero).increaseRotation(0.05),
      () => (h.role as Hero).increaseRotation(0.05)
    );
  }

  // The default behavior is for a hero to be able to jump any time it collides
  // with an obstacle. This isn't, of course, the smartest way to do things,
  // since a hero in the air shouldn't jump.  One way to solve the problem is by
  // altering the pre-solve code in Collisions.ts. Another approach, which is
  // much simpler, is to mark some walls so that the hero doesn't have jump
  // re-enabled upon a collision.
  else if (level == 67) {
    stage.world.setGravity(0, 10);
    enableTilt(10, 0);
    welcomeMessage("Press the hero to make it jump");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });

    let cfg = { cx: 15, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 0.5, friction: 0.6 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    // the hero can jump while on this obstacle
    let boxCfg = { cx: 6, cy: 7, width: 3, height: 0.1, fillColor: "#FF0000" };
    Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { density: 1, friction: 0.5 }),
      role: new Obstacle(),
    });

    // the hero can't jump while on this obstacle
    boxCfg = { cx: 10, cy: 7, width: 3, height: 0.1, fillColor: "#FF0000" };
    Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { density: 1, friction: 0.5 }),
      role: new Obstacle({ jumpReEnableSides: [] }),
    });
  }

  // When something chases an entity, we might not want it to chase in both the
  // X and Y dimensions... this shows how we can chase in a single direction.
  // It also shows how things can move through walls.
  else if (level == 68) {
    // set up a simple level
    enableTilt(10, 10);
    welcomeMessage("You can walk through the wall");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // Make a hero who moves via tilt
    let cfg = { cx: 5.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "leg_star_1.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { passThroughId: 7 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    cfg = { cx: 14, cy: 2, radius: 1, width: 2, height: 2, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // These obstacles chase the hero, but only in one dimension
    cfg = { cx: .5, cy: 2.5, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { collisionsEnabled: true }),
      movement: new BasicChase(15, h, false, true),
      role: new Enemy(),
    });

    cfg = { cx: 2.5, cy: .5, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      // There is a very important concept hiding here.  There are three types of
      // rigid bodies: static, kinematic, and dynamic.  Briefly, static bodies
      // can't move.  kinematic bodies can move, but (1) they can't have forces
      // applied to them (like gravity) and (2) they can't initiate a collision.
      // dynamic bodies can move, can have forces, and can initiate collisions
      // (with static, dynamic, or kinematic bodies).  If you don't make this
      // enemy dynamic, it will default to kinematic, and it will go through the
      // wall (because the collision won't "count").
      //
      // If you're wondering, dynamic bodies are expensive.  And also, sometimes
      // you don't want things to experience forces.  That's why all three exist.
      rigidBody: new CircleBody(cfg, stage.world, { collisionsEnabled: true, dynamic: true }),
      movement: new BasicChase(15, h, true, false),
      role: new Enemy(),
    });

    // Here's a wall, and a movable round obstacle
    let boxCfg = { cx: 7, cy: 1, width: 0.5, height: 5, fillColor: "#FF0000" };
    Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { passThroughId: 7 }),
      role: new Obstacle(),
    });
    // The hero can pass through this wall, because both have the same
    // passthrough value.  Try changing the value to see what happens.

    cfg = { cx: 8, cy: 8, radius: 1, width: 2, height: 2, img: "blue_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      // TiltMovement automatically switches the obstacle to "dynamic", so it will
      // collide with the wall.
      movement: new TiltMovement(),
      role: new Obstacle(),
    });
  }

  // Sometimes, we want to make an actor move when we press a control, but when
  // we release we don't want an immediate stop. This shows how to achieve that
  // effect.
  else if (level == 75) {
    stage.world.setGravity(0, 10);
    welcomeMessage("Press anywhere to start moving");
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

    stage.world.camera.setCameraFocus(h, 5, 0);
    stage.world.camera.setBounds(0, 0, 64, 9);

    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ cx: 8, cy: 4.5, }, { imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // This control has a dampening effect, so that on release, the hero
    // slowly stops
    addToggleButton(stage.hud,
      { cx: 8, cy: 4.5, width: 16, height: 9, img: "" },
      makeXYDampenedMotionAction(h, 10, 0, 0),
      makeXYDampenedMotionAction(h, 10, 0, 1)
    );
  }

  // Sometimes we need to manually force an entity to be immune to
  // gravity.
  else if (level == 78) {
    stage.world.setGravity(0, 10);
    enableTilt(10, 0);
    welcomeMessage("Testing Gravity Defy?");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 1, friction: 0.6, disableRotation: true }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    h.gestures = { tap: () => { (h.role as Hero).jump(0, -15); return true; } }
    cfg = { cx: 15, cy: 4, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { dynamic: true }),
      movement: new StandardMovement(),
      role: new Destination(),
    });
    // When we attach a rigidBody and destination role to an actor, the
    // collisions get turned off.  Turn them back on, or the destination will go
    // through the wall.
    d.rigidBody.setCollisionsEnabled(true);

    // make the movement with an absolute velocity and with gravity defy turned
    // on.  Now it's a dynamic body, but gravity doesn't affect it.  It can
    // move, it can collide with obstacles, but it won't fall downward.
    (d.movement as StandardMovement).setAbsoluteVelocity(-2, 0);
    (d.movement as StandardMovement).setGravityDefy();
    stage.score.setVictoryDestination(1);
  }

  // This level shows that polygons with irregular shapes don't really shrink
  // nicely.  If that's going to be a problem for your game, you might want to
  // work on the shrink code and then share it with me :)
  else if (level == 79) {
    enableTilt(10, 10);
    welcomeMessage("Testing Polygons");
    winMessage("Great Job");
    loseMessage("Try Again");
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 1.25, cy: 6.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { disableRotation: true }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    cfg = { cx: 15, cy: 4, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // create a polygon obstacle
    // Be sure to turn on debug boxes in GameConfig.ts to see the true shape
    let polyCfg = { cx: 2, cy: 2, width: 2, height: 5, img: "blue_ball.png", vertices: [-1, 2, -1, 0, 0, -3, 1, 0, 1, 1] };
    let o = Actor.Make({
      appearance: new ImageSprite(polyCfg),
      rigidBody: new PolygonBody(polyCfg, stage.world),
      role: new Obstacle(),
    });

    setShrinkOverTime(o, 0.1, 0.1, true);
  }

  // we can attach movement buttons to any moveable entity, so in this case, we
  // attach it to an obstacle to get an Arkanoid-like effect.
  else if (level == 58) {
    drawBoundingBox(0, 0, 16, 9, .1);

    let cfg = { cx: 14, cy: 1, radius: 0.125, width: 0.25, height: 0.25, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination(),
    });

    stage.score.setVictoryDestination(1);

    // make a hero who is always moving... note there is no friction,
    // anywhere, and the hero is elastic... it won't ever stop...
    cfg = { cx: 4, cy: 4, width: 0.5, height: 0.5, radius: 0.25, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { elasticity: 1, friction: 0.1 }),
      movement: new StandardMovement(),
      role: new Hero(),
    });
    (h.movement as StandardMovement).addVelocity(0, 10);

    // make an obstacle and then connect it to some controls
    let boxCfg = { cx: 2, cy: 8.75, width: 1, height: 0.5, fillColor: "#FF0000" };
    let o = Actor.Make({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, stage.world, { density: 100, elasticity: 1, friction: 0.1 }),
      movement: new StandardMovement(),
      role: new Obstacle(),
    });

    addToggleButton(
      stage.hud,
      { cx: 4, cy: 4.5, width: 8, height: 9, img: "" },
      () => (o.movement as StandardMovement).updateXVelocity(-5),
      () => (o.movement as StandardMovement).updateXVelocity(0)
    );
    addToggleButton(
      stage.hud,
      { cx: 12, cy: 4.5, width: 8, height: 9, img: "" },
      () => (o.movement as StandardMovement).updateXVelocity(5),
      () => (o.movement as StandardMovement).updateXVelocity(0)
    );
  }

}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
