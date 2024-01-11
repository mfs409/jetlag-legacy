import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, ImageSprite } from "../jetlag/Components/Appearance";
import { ChaseMovement, GravityMovement, ManualMovement, Path, PathMovement, TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { Destination, Enemy, Goodie, Hero, Obstacle } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { TimedEvent } from "../jetlag/Systems/Timer";
import { b2Vec2 } from "@box2d/core";
import { levelController, enableTilt, boundingBox } from "./common";
import { AccelerometerMode } from "../jetlag/Services/Accelerometer";

/**
 * Screen dimensions and other game configuration, such as the names of all
 * the assets (images and sounds) used by this game.
 */
class Config implements JetLagGameConfig {
  pixelMeterRatio = 100;
  screenDimensions = { width: 1600, height: 900 };
  adaptToScreenSize = true;
  canVibrate = true;
  accelerometerMode = AccelerometerMode.DISABLED;
  storageKey = "--no-key--";
  hitBoxes = true;
  resourcePrefix = "./assets/";
  musicNames = [];
  soundNames = [];
  imageNames = ["sprites.json", "mid.png"];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  // Set up the level controller, so we can easily switch among levels
  levelController(level, 11, builder);

  if (level == 1) {
    // There's lots more we can explore in the configuration of rigid bodies,
    // but having some better ways of moving the hero would make it easier for
    // us to explore them, so let's switch gears and start looking at ways to
    // move an actor.  We've already seen Tilt, which is nice and
    // straightforward.  We've also seen "Inert", the default movement policy.

    // A rather uninteresting movement is the "GravityMovement".  This isn't
    // really a movement at all... it just says that gravity will affect the
    // actor.  It's not really any different from making the body "dynamic", but
    // sometimes it's useful.  Let's try it out here.  We'll make "enemies" that
    // fall from the sky, and the "hero" needs to dodge them.  When enemies
    // collide with the ground, they'll disappear.  Don't worry if some of this
    // doesn't make sense yet... we'll explain it all later.
    enableTilt(10, 0); // Now tilt will only control left/right
    let walls = boundingBox();
    (walls.b.role as Obstacle).enemyCollision = (_thisActor: Actor, enemy: Actor) => {
      (enemy.role as Enemy).defeat(false);
    }
    walls.t.enabled = false; // No top wall

    // Downward gravity
    stage.world.setGravity(0, 10);

    // Falling enemies
    stage.world.timer.addEvent(new TimedEvent(1, true, () => new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cy: -.5, cx: .5 + (Math.random() * 15) }),
      role: new Enemy(),
      movement: new GravityMovement(),
    })));

    // A hero moving via tilt.  Notice that the ball "rolls" on the ground, even
    // though there's no friction.  That's because of gravity.
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 8.6, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // Any time it's possible to "lose", we need to tell JetLag what to do if the level is lost
    stage.score.onLose = { level, builder }
  }

  else if (level == 2) {
    // Let's look at "path" movement.  This lets us specify a set of waypoints,
    // and the actor will move from one to the next.  We even can let paths
    // repeat.

    // Moving around in the world will make this more interesting!
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 8.6, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });
    enableTilt(10, 10);

    // This actor moves to a position and stops
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: .5, cy: .5 }),
      role: new Obstacle(),
      movement: new PathMovement(new Path().to(.5, .5).to(15.5, .5), 2, false),
    });

    // This actor loops, and is faster.  Also, actors on paths don't have to be
    // obstacles, they can have any role...
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 1.5, cy: 1.5 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(.5, 1.5).to(15.5, 1.5), 5, true),
    });

    // Since there's an enemy, we need a way to lose...
    stage.score.onLose = { level, builder }

    // The last one was a bit odd.  This one has *three* points.
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 2.5, cy: 1.5 }),
      role: new Enemy(),
      movement: new PathMovement(new Path().to(.5, 2.5).to(15.5, 2.5).to(.5, 2.5), 5, true),
    });

    // Of course, paths can go from anywhere to anywhere... even off the screen.
    // The default is that Actors on paths are kinematic, so they can go through
    // walls.
    boundingBox();
    // Since we're going to make a complex path, let's use some code to make it:
    let p = new Path();
    let lastX = -.5;
    let lastY = 2;
    let up = true;
    while (lastX <= 16.5) {
      p.to(lastX, lastY);
      lastX += 1;
      if (up) lastY += 1; else lastY -= 1;
      up = !up;
    }
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: p.getPoint(0).x, cy: p.getPoint(0).y }),
      role: new Obstacle(),
      movement: new PathMovement(p, 5, true),
    });

    // If a point on the path is directly between two other points, you won't
    // notice it's there.  The velocity is all that matters
    let p2 = new Path().to(-.5, 5).to(8, 5).to(16.5, 5).to(-.5, 5);
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: p2.getPoint(0).x, cy: p2.getPoint(0).y }),
      role: new Obstacle(),
      movement: new PathMovement(p2, 5, true),
    });

    // But once we've done that, we can re-use the path, letting the next actor
    // jump forward by a waypoint:
    let a2 = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "purple_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: p2.getPoint(0).x, cy: p2.getPoint(0).y }),
      role: new Obstacle(),
      movement: new PathMovement(p2, 5, true),
    });
    (a2.movement as PathMovement).skip_to(1);
    // Notice that we didn't get cx and cy right.  That's OK, as long as you
    // don't have too many dynamic things with the same cx/cy.

    // We can make actors on paths dynamic.  This is usually a bad idea if
    // collisions are enabled (which is, of course, the default).  Try colliding
    // with this.  It will mess up the whole path system.
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 2.5, cy: 1.5 }, { dynamic: true }),
      role: new Obstacle(),
      movement: new PathMovement(new Path().to(.5, 6.5).to(15.5, 6.5).to(.5, 6.5), 5, true),
    });

    // Lastly, let's observe that we can run code whenever an actor reaches a
    // waypoint.  In this example, we'll only do something on the second
    // waypoint (waypoint #1):
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "grey_ball.png" }),
      rigidBody: new CircleBody({ radius: .5, cx: 2.5, cy: 7.5 }),
      role: new Obstacle(),
      movement: new PathMovement(new Path().to(-.5, 7.5).to(8, 8.5).to(16.5, 7.5).to(8, 8.5).to(-.5, 7.5), 5, true, (which: number) => {
        if (which == 1 || which == 3) {
          new Actor({
            appearance: new ImageSprite({ width: .5, height: .5, img: "grey_ball.png" }),
            rigidBody: new CircleBody({ radius: .25, cx: 1.5 - Math.random(), cy: 1.5 - Math.random() }, { dynamic: true }),
            role: new Goodie(),
          });
        }
      }),
    });
  }

  else if (level == 3) {
    // Another way of moving things is via "chase".  Chase isn't incredibly
    // complicated... we just cast a line from the chasing actor to the actor it
    // is chasing.  Surprisingly, this can seem like a really smart "AI" in some
    // games.

    boundingBox();
    enableTilt(10, 10);

    // Make a hero who we control via tilt
    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // create an enemy who chases the hero
    new Actor({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 1, radius: 0.25 }),
      movement: new ChaseMovement({ speed: 1, target: h }),
      role: new Enemy(),
    });

    stage.score.onLose = { level, builder }
  }

  else if (level == 4) {
    // Chasing in only one dimension can be useful for neat UI effects, or for
    // things like a soccer goalie.  We'll try it out here.

    boundingBox();
    enableTilt(10, 10);

    // Make a hero who moves via tilt
    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 5.25, cy: 5.25, radius: 0.4, }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // These obstacles chase the hero, but only in one dimension
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 0, cy: 2.5, radius: 0.5 }),
      movement: new ChaseMovement({ speed: 10, target: h, chaseInX: false }),
      role: new Obstacle(),
    });

    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 2.5, cy: 0, radius: 0.5, }),
      movement: new ChaseMovement({ speed: 10, target: h, chaseInY: false }),
      role: new Obstacle(),
    });
  }

  else if (level == 5) {
    // Sometimes we only want chasing in one direction.
    enableTilt(10, 0);
    stage.world.setGravity(0, 10);
    boundingBox();

    // Just for fun, we'll have an auto-scrolling background, to make it look
    // like we're moving all the time
    stage.background.addLayer({ anchor: { cx: 8, cy: 4.5 }, imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: -5 / 1000, isAuto: true });

    // Make a hero and an enemy that slowly moves toward the hero
    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      role: new Hero(),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }),
      movement: new TiltMovement(),
      gestures: { tap: () => { h.rigidBody.setVelocity(new b2Vec2(h.rigidBody.getVelocity().x, -10)); return true; } }
    });

    // This enemy will slowly move toward the hero
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      role: new Obstacle(),
      rigidBody: new CircleBody({ cx: 15, cy: 2, radius: 0.4 }, { dynamic: true }),
      movement: new ChaseMovement({ target: h, chaseInY: false, speed: 0.9 })
    });
  }

  else if (level == 6) {
    // Most of the movements we've looked at so far have been kind of automatic.
    // Now let's look at the last movement technique, ManualMovement.  This is
    // for when you want complete control over the movement of the actor.
    stage.world.setGravity(0, 0);
    boundingBox();

    // First, make the hero with ManualMovement as its movement component
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 4, cy: 8, radius: 0.25 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });

    // Now let's say that pressing a key should update its velocity, and
    // releasing should set that part of the velocity to 0:
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(5)));

    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));

    // We'll use the 'a' and 's' keys to rotate counterclockwise and clockwise
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_A, () => (hero.movement as ManualMovement).increaseRotation(-0.05))
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_S, () => (hero.movement as ManualMovement).increaseRotation(0.05))
  }

  else if (level == 7) {
    // We can use ManualMovement along with fixed speeds, so that there's only
    // control in one dimension

    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ anchor: { cx: 8, cy: 4.5, }, imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4, }, { disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (hero.movement as ManualMovement).addVelocity(5, 0);

    stage.world.camera.setCameraFocus(hero);

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(5)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(0)));
  }

  else if (level == 8) {
    // In the last level, there was a "disableRotation" parameter.  This can be
    // very useful, especially in platformer-type games.
    stage.world.setGravity(0, 10);
    boundingBox();

    // If we don't have the `disableRotation` option here, then if the hero just
    // barely nicks the corner of the platform, it will rotate as it falls!
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new BoxBody({ cx: 1, cy: 5.25, width: .8, height: .8 }, { disableRotation: false }),
      movement: new ManualMovement(),
      role: new Hero(),
    });

    new Actor({
      appearance: new FilledBox({ width: 2, height: .25, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ width: 2, height: .25, cx: 4, cy: 7 }),
      role: new Obstacle(),
    });

    // "jumping" is a special behavior, and it's part of the *hero*, not the
    // *movement*.
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => ((hero.role as Hero).jump(0, -7.5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(5)));

    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(0)));
  }

  else if (level == 9) {
    // Sometimes, we want to make an actor move when we press a control, but when
    // we release we don't want an immediate stop. This shows how to achieve that
    // effect.
    stage.world.setGravity(0, 0);
    boundingBox();

    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.75, height: 1.5, img: "green_ball.png" }),
      rigidBody: new BoxBody({ cx: 2, cy: 4, width: 0.75, height: 1.5, }),
      movement: new ManualMovement(),
      role: new Hero(),
    });

    // Be sure to turn off each of these, and watch what happens as the hero moves
    (hero.movement as ManualMovement).setDamping(1);
    (hero.movement as ManualMovement).setAngularDamping(1);

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((hero.movement as ManualMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((hero.movement as ManualMovement).updateXVelocity(5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_UP, () => ((hero.movement as ManualMovement).updateYVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_DOWN, () => ((hero.movement as ManualMovement).updateYVelocity(5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_A, () => ((hero.movement as ManualMovement).updateAngularVelocity(-1)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_S, () => ((hero.movement as ManualMovement).updateAngularVelocity(1)));

    stage.backgroundColor = "#17b4ff";
    stage.background.addLayer({ anchor: { cx: 8, cy: 4.5, }, imageMaker: () => new ImageSprite({ width: 16, height: 9, img: "mid.png" }), speed: 0 });
  }

  else if (level == 10) {
    // Another neat feature in ManualMovement is that we can force an actor to
    // be immune to gravity.
    stage.world.setGravity(0, 10);
    boundingBox();

    // Destinations default to having collisions disabled.  We don't want this
    // to fly off screen, so we need to re-enable collisions, and we need to
    // make it dynamic.
    let d = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 15, cy: 4, radius: 0.5 }, { dynamic: true }),
      movement: new ManualMovement(),
      role: new Destination(),
    });
    (d.movement as ManualMovement).setAbsoluteVelocity(-2, 0);
    d.rigidBody.setCollisionsEnabled(true);

    // But now that it's dynamic, gravity affects it, and it falls.  This fixes
    // it:
    (d.movement as ManualMovement).setGravityDefy();
  }

  else if (level == 11) {
    // Since we can attach ManualMovement to any actor, let's put it all
    // together by making a block breaking game!
    boundingBox();

    // make a hero who is always moving... note there is no friction,
    // anywhere, and the hero is elastic... it won't ever stop...
    let h = new Actor({
      appearance: new ImageSprite({ width: 0.5, height: 0.5, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 7, radius: 0.25 }, { elasticity: 1, friction: 0.1 }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    (h.movement as ManualMovement).addVelocity(0, 8);

    // make an obstacle and then connect it to some controls
    let boxCfg = { cx: 8, cy: 8.75, width: 2, height: 0.5, fillColor: "#FF0000" };
    let o = new Actor({
      appearance: new FilledBox(boxCfg),
      rigidBody: new BoxBody(boxCfg, { density: 10, elasticity: 1, friction: 0.1 }),
      movement: new ManualMovement(),
      role: new Obstacle(),
    });

    let colors = ["#FF0000", "#FFFF00", "#FF00FF", "#00FF00", "#00FFFF", "#0000FF"];
    for (let r = .25; r < 4.25; r += .5) {
      for (let c = .5; c < 16; c += 1) {
        new Actor({
          appearance: new FilledBox({ width: 1, height: .5, fillColor: colors[Math.trunc(Math.random() * 6)] }),
          rigidBody: new BoxBody({ cx: c, cy: r, width: 1, height: .5 }, { density: 1 }),
          role: new Obstacle({ heroCollision: (thisActor: Actor) => thisActor.enabled = false })
        });
      }
    }

    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => ((o.movement as ManualMovement).updateXVelocity(-5)));
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => ((o.movement as ManualMovement).updateXVelocity(5)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => ((o.movement as ManualMovement).updateXVelocity(0)));
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => ((o.movement as ManualMovement).updateXVelocity(0)));

    // This is far from perfect... in particular, it's possible in our current
    // physics configuration to get the ball to move left-right in an infinite
    // cycle.  We'd probably want heroCollisions on the walls, to correct for
    // bad velocities.  But still, it's a nice start!
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
