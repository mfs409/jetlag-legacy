// Last review: 08-10-2023

import { BasicChase, ChaseFixed, Draggable, FlickMovement, GravityMovement, HoverFlick, HoverMovement, PathMovement, TiltMovement, Path, ExplicitMovement } from "../jetlag/Components/Movement";
import { game } from "../jetlag/Stage";
import { StageTypes } from "../jetlag/Systems/Score";
import * as Helpers from "./helpers";
import { ProjectileSystem } from "../jetlag/Systems/Projectiles";
import { Scene } from "../jetlag/Entities/Scene";
import { AnimatedSprite, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { Actor } from "../jetlag/Entities/Actor";
import { b2Vec2 } from "@box2d/core";
import { RigidBodyComponent } from "../jetlag/Components/RigidBody";
import { Hero, Destination, Enemy, Goodie, Obstacle, Sensor } from "../jetlag/Components/Role";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { SoundEffectComponent } from "../jetlag/Components/SoundEffect";
import { TimedEvent } from "../jetlag/Systems/Timer";
import { AnimationSequence } from "../jetlag/Config";
import { SvgSystem } from "../jetlag/Systems/Svg";

/**
 * buildLevelScreen is used to draw the playable levels of the game
 *
 * We currently have 90 levels, each of which is described in part of the
 * following function.
 *
 * Remember that this code creates the initial configuration of the level, after
 * which the physics simulator takes over and starts running the game.
 *
 * @param index Which level should be displayed
 */
export function buildLevelScreen(index: number) {
  // In this level, all we have is a hero (the green ball) who needs to make it
  // to the destination (a mustard colored ball).  The game is configured to use
  // tilt to control the world.  If your device doesn't have tilt support, the
  // arrow keys can simulate tilting.
  if (index == 1) {
    // Remember that our GameConfig object set some important parameters that
    // affect what we see here.  A particularly important point is that the
    // visible portion of the world is 16 meters wide and 9 meters high.

    // Turn on tilt support, and indicate that the maximum force is +/- 10
    // m/(s^2) in each of the X and Y dimensions
    //
    // Note that there is no default gravitational force.  That means that tilt
    // is going to have an equal effect if we tilt left, right, up, or down.
    // You can think about this kind of game like you're rolling a ball on a
    // flat surface, by tilting the surface.
    Helpers.enableTilt(10, 10);

    // Create a circular hero whose top left corner is at (2, 3), with a
    // diameter of .8 meters.  Use the "green_ball" image (from the "assets"
    // folder; see GameConfig.ts) to show the hero.  Since the image is a
    // square, say that the width and height are .8 meters, so that the hit box
    // will look right.
    //
    // Note:  Don't worry about "game.world" for now :)
    let h = new Actor(game.world);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle({ cx: 2, cy: 3, radius: 0.4 }, game.world);
    h.appearance = new ImageSprite({ cx: 2, cy: 3, width: 0.8, height: 0.8, img: "green_ball.png" });
    h.movement = new TiltMovement(); // The hero will move via phone tilt

    // It's really easy to make mistakes when we make Actors like that, because
    // we had to remember to use the same x and y.  We can make a
    // "configuration" variable that has the union of the things we need for
    // making circles and making images.  Let's try it by making a destination.

    // Note that in most cases, if you aren't sure what something means, you can
    // hover your mouse over it to get some help
    let cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, img: "mustard_ball.png", radius: 0.4 };
    let d = new Actor(game.world);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    d.appearance = new ImageSprite(cfg);

    // Indicate that the way to win the level is to have one hero reach a
    // destination.
    game.score.setVictoryDestination(1);

    // Indicate that we want to print a message when the player wins the level
    //
    // Note: there is actually a lot of code behind making this message.  It all
    // appears at the bottom of this file, as a function.  Later, we'll  explore
    // the function, and we will also see how to make different sorts of win
    // messages
    winMessage("Great Job");

    // That's it.  You can go ahead and play the game.  Remember to press
    // "escape" or your phone's "back" button if you want to go back to the
    // menu.
  }

  // In the last level, the green ball could go off screen, and there were no
  // instructions when we started.  Let's re-create the level, and make it a
  // little nicer.
  else if (index == 2) {
    // start by setting everything like in level 1
    Helpers.enableTilt(10, 10);
    let cfg = { cx: 2, cy: 3, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    h.appearance = new ImageSprite(cfg);
    h.movement = new TiltMovement();

    // notice that when we want to change cfg, we don't put a "let" in front
    cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    d.appearance = new ImageSprite(cfg);

    game.score.setVictoryDestination(1);
    winMessage("You made it!");

    // add a bounding box so the hero can't fall off the screen.  Hover your
    // mouse over 'drawBoundingBox' to learn about what the parameters mean.
    // This really should have a box width, instead of hard-coding it
    Helpers.drawBoundingBox(0, 0, 16, 9, .1);

    // In the same way that we make "win" messages, we can also make a "welcome"
    // message to show before the level starts.  Again, there is a lot of code
    // involved in making a welcome message, which we will explore later on
    welcomeMessage("Use tilt (or arrows) to reach the destination");
  }

  // The previous level had a weird visual glitch: when the green ball hit a
  // wall, it just sort of glided along, instead of rolling.  We'll add some
  // density/elasticity/friction to the ball and walls, so we get a nicer
  // behavior.
  else if (index == 3) {
    Helpers.enableTilt(10, 10);
    let cfg = { cx: 2, cy: 3, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.role = new Hero();
    // In the next line, we can give some additional configuration to the hero's
    // circle.  It's dense, so it's going to move slowly.  It has friction, so
    // if it collides with something that also has friction, good things will
    // happen :)
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.appearance = new ImageSprite(cfg);
    h.movement = new TiltMovement();

    // notice that when we want to change cfg, we don't put a "let" in front
    cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    d.appearance = new ImageSprite(cfg);

    game.score.setVictoryDestination(1);
    winMessage("You made it!");

    // Assign some density, elasticity, and friction to the bounding box.
    //
    // Note:  You should see what happens when you change these numbers.
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 0.9 });

    // This welcome message is also a good reminder: when you're testing a game,
    // don't just try to win... test out all the behaviors that you expect, even
    // ones related to losing, going to wrong way, etc.
    welcomeMessage("When the hero hits a wall at an angle, the hero should spin");
  }

  // It's not likely that you'd want to have multiple heroes and multiple
  // destinations, but it is possible.  In this level, there are two heroes and
  // two destinations.  Each destination can only hold one hero, but it doesn't
  // matter which hero goes to which destination.
  else if (index == 4) {
    // Let's start with the easy stuff:
    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 0.9 });
    winMessage("Great Job");
    // In the next line, notice how the pair of characters "\n" will cause a
    // newline to appear in the text.
    welcomeMessage("Each destination can hold one hero\n\nBoth heroes must reach a destination to win this level");

    // Now let's draw two heroes who can both move by tilting, and who both
    // have density and friction. Note that we lower the density, so they
    // move faster than in the previous level
    let hero_cfg = { cx: 4, cy: 7, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h1 = new Actor(game.world);
    h1.role = new Hero();
    h1.appearance = new ImageSprite(hero_cfg);
    h1.rigidBody = RigidBodyComponent.Circle(hero_cfg, game.world, { density: 2, friction: 0.6 });
    h1.movement = new TiltMovement();

    // As we make the second hero, notice that it doesn't matter what order we
    // assign the role, movement, rigidBody, or appearance.
    hero_cfg = { cx: 6, cy: 7, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h2 = new Actor(game.world);
    h2.movement = new TiltMovement();
    h2.rigidBody = RigidBodyComponent.Circle(hero_cfg, game.world, { density: 2, friction: 0.6 });
    h2.appearance = new ImageSprite(hero_cfg);
    h2.role = new Hero();

    // We will make two destinations.  By default, each can only hold ONE hero.
    // One thing to notice here is that we made a new configuration object for
    // the destinations, and we added a "z" to it.  The default "z" is 0.  Valid
    // values are -2, -1, 0, 1, and 2.  We can use this to make sure that some
    // things appear "on top of" others.  If you're curious, things with the
    // same "z" will be drawn on top of each other based on the order in which
    // their "appearances" were created.
    let dest_cfg = { cx: 15, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png", z: 1 };
    let d1 = new Actor(game.world);
    d1.appearance = new ImageSprite(dest_cfg);
    d1.rigidBody = RigidBodyComponent.Circle(dest_cfg, game.world);
    d1.role = new Destination();

    dest_cfg = { cx: 15, cy: 7, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png", z: -1 };
    let d2 = new Actor(game.world);
    d2.appearance = new ImageSprite(dest_cfg);
    d2.rigidBody = RigidBodyComponent.Circle(dest_cfg, game.world);
    d2.role = new Destination();

    // Insist that two heroes reach destinations in order to complete the level
    game.score.setVictoryDestination(2);
  }

  // This level demonstrates that we can have many heroes that can reach the
  // same destination.  It also has a sound effect when the hero reaches the
  // destination.
  else if (index == 5) {
    // Configure things like in the previous level
    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    welcomeMessage("All heroes must\nreach the destination");
    winMessage("Great Job");

    let cfg = { cx: 4, cy: 7, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h1 = new Actor(game.world);
    h1.appearance = new ImageSprite(cfg);
    h1.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h1.role = new Hero();
    h1.movement = new TiltMovement();

    cfg = { cx: 6, cy: 7, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h2 = new Actor(game.world);
    h2.appearance = new ImageSprite(cfg);
    h2.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h2.role = new Hero();
    h2.movement = new TiltMovement();

    // Make ONE destination, but indicate that it can hold TWO heroes
    // Let's also say that whenever a hero reaches the destination, a sound
    // will play
    cfg = { cx: 15, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    d.role = new Destination({ capacity: 2, arrivalSound: "high_pitch.ogg" });

    // Notice that this line didn't change from level 4: we still need a
    // total of 2 heroes reaching destinations
    game.score.setVictoryDestination(2);
  }

  // Tilt can be used to directly set an Actor's velocity, instead of applying
  // forces to the Actor.  This technique doesn't always work well, but it's a
  // nice option to have, so let's try it out.
  else if (index == 6) {
    // To turn on "tilt as velocity", all we need to do is pass in an extra
    // "true" to "enableTilt"
    Helpers.enableTilt(10, 10, true);

    // The rest of this level should be pretty familiar by now :)
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    welcomeMessage("Tilt can change velocity, instead of\n" + "applying a force to actors.");
    winMessage("Great Job");

    let cfg = { cx: 4, cy: 7, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.role = new Hero();
    h.movement = new TiltMovement();

    cfg = { cx: 15, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    d.role = new Destination();

    game.score.setVictoryDestination(1);
  }

  // So far, it has been impossible to lose a level.  In this level, we add an
  // Enemy actor.  If the hero collides with the Enemy, the level will be
  // lost, and there will be an option to try again.
  else if (index == 7) {
    // Let's start with the familiar stuff
    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 4, cy: 7, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { friction: 0.6 });
    h.role = new Hero();
    h.movement = new TiltMovement();

    cfg = { cx: 15, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    d.role = new Destination();

    game.score.setVictoryDestination(1);
    welcomeMessage("Avoid the enemy and\nreach the destination");
    winMessage("Great Job");

    // Make an enemy.  You're probably starting to notice that there's a lot of
    // similarity in how we make all of these different actors.
    cfg = { cx: 14, cy: 1.5, radius: 0.4, width: 0.8, height: 0.8, img: "red_ball.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    // Remember that the name "e" doesn't really matter.  What makes this Actor
    // an enemy, instead of a Destination or Hero, is that we assign it the
    // "Enemy" role.
    e.role = new Enemy();

    // When the level is lost, we will print a message.  loseMessage is a lot
    // like winMessage, but let's not worry about that yet.
    loseMessage("Try again");
  }

  // This level explores a bit more of what we can do with enemies, by having
  // an enemy that moves along a fixed path.  Note that every actor can move
  // along a fixed path, not just enemies.
  else if (index == 8) {
    // Let's set up everything except the enemy, just like in the previous level
    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 4, cy: 7, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { friction: .3 });
    h.role = new Hero();
    h.movement = new TiltMovement();

    cfg = { cx: 15, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    d.role = new Destination();

    game.score.setVictoryDestination(1);
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
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    e.role = new Enemy();
    // This is the third kind of movement we've seen.  The first was Tilt.  The
    // second was "no movement".

    e.movement = new PathMovement(new Path().to(14, 9.4).to(14, -0.4), 4, true);

    // Note that if we don't use winMessage() and loseMessage(), then when the
    // player wins or loses, gameplay will immediately (re)start at the
    // appropriate level. Be sure to test it out by losing *and* winning.
  }

  // This level also puts an enemy on a path, but now the path has three
  // points, so that the enemy returns to its starting point
  else if (index == 9) {
    // Just about everything in this level is the same as the previous level :)
    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 4, cy: 7, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { friction: .3 });
    h.role = new Hero();
    h.movement = new TiltMovement();

    cfg = { cx: 15, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    d.role = new Destination();

    game.score.setVictoryDestination(1);
    welcomeMessage("Avoid the enemy and\nreach the destination");

    // Notice how the Enemy path has 3 points, so that it travels back and
    // forth, and the points keep it on screen.  Paths can be made extremely
    // complex.  Be sure to try a lot of variations.
    cfg = { cx: 14, cy: 8.6, radius: 0.4, width: 0.8, height: 0.8, img: "red_ball.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    e.role = new Enemy();
    e.movement = new PathMovement(new Path().to(14, 8.6).to(12, 0.4).to(14, 8.6), 4, true);

    loseMessage("Try Again");
    winMessage("Great Job");
  }

  // In general, if you can do something to one kind of Actor, you can do it to
  // all the kinds of actors.  In this level, we'll use Tilt to control the
  // enemy, too.  We'll also see that we can make actors rotate.
  else if (index == 10) {
    // So far, we've set up all our levels like this:
    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 4, cy: 7, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { friction: .3 });
    h.role = new Hero();
    h.movement = new TiltMovement();

    cfg = { cx: 15, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    // If we want to make something rotate, we can do it like this.  The ".5"
    // means one rotation per second
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { rotationSpeed: .5 });
    d.role = new Destination();


    // Make an enemy who moves due to tilt
    cfg = { cx: 14, cy: 1.5, radius: 0.4, width: 0.8, height: 0.8, img: "red_ball.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, elasticity: 0.3, friction: 0.6 });
    e.role = new Enemy();
    e.movement = new TiltMovement();

    // Play some music
    Helpers.setMusic("tune.ogg");

    game.score.setVictoryDestination(1);
    winMessage("Great Job");
    loseMessage("Better luck next time...");
    welcomeMessage("The enemy is also controlled by tilt.");
  }

  // This shows that it is possible to make a level that is larger than a
  // screen.
  //
  // This level also introduces the "heads up display" (the "HUD").  We can put
  // information on the HUD, and we can also draw actors on the hud who we can
  // touch in order to achieve new behaviors.  In this case, we'll put zoom-in
  // and zoom-out buttons on the HUD.
  else if (index == 11) {
    // make the level really big, and set up tilt
    game.world.camera.setBounds(64, 36);
    Helpers.drawBoundingBox(0, 0, 64, 36, .1, { density: 1, elasticity: .3, friction: .4 });
    Helpers.enableTilt(10, 10);

    // put the hero and destination far apart
    let cfg = { cx: 1, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { friction: 0.6 });
    h.role = new Hero();
    h.movement = new TiltMovement();

    cfg = { cx: 63, cy: 35, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    d.role = new Destination();

    game.score.setVictoryDestination(1);

    // By default, the camera is centered on the point 8, 4.5f.  We can instead
    // have the camera stay centered on the hero, so that we can keep seeing the
    // hero as it moves around the world.  Note that this is the most
    // rudimentary way to follow the hero's movement, and it's not going to look
    // good when the hero is close to the level's boundaries.
    game.world.camera.setCameraChase(h);

    // add zoom buttons. We are using blank images, which means that the buttons
    // will be invisible... that's nice, because we can make the buttons big
    // (covering the left and right halves of the screen).  When debug rendering
    // is turned on, we'll be able to see an outline of the two rectangles. You
    // could also use images, but if you did, you'd probably want to use some
    // transparency so that they don't cover up the gameplay.
    Helpers.addTapControl(game.hud, { cx: 4, cy: 4.5, width: 8, height: 9, img: "" }, () => {
      if (game.world.camera.getScale() > 50) game.world.camera.setScale(game.world.camera.getScale() - 10);
      return true;
    });
    Helpers.addTapControl(game.hud, { cx: 12, cy: 4.5, width: 8, height: 9, img: "" }, () => {
      if (game.world.camera.getScale() < 200) game.world.camera.setScale(game.world.camera.getScale() + 20);
      return true;
    });
    // Did you notice "game.hud" instead of "game.world"?  If you looked at the
    // bottom of this file, you'd find a spot where we write the level umber to
    // the top right corner of the HUD.

    // As the hero moves around, it's going to be hard to see that it's really
    // moving.  Draw some "noise" in the background.  Note that we're changing
    // the Z index.
    //
    // This code uses "for loops".  The outer loop will run 4 times (0, 16, 32,
    // 48).  Each time, the inner loop will run 4 times (0, 9, 18, 27), drawing
    // a total of 16 images.
    for (let x = 0; x < 64; x += 16) {
      for (let y = 0; y < 36; y += 9) {
        // This is kind of neat: a picture is just an actor without a role or rigidBody
        let a = new Actor(game.world);
        a.appearance = new ImageSprite({ cx: x + 8, cy: y + 4.5, width: 16, height: 9, img: "noise.png", z: -1 });
      }
    }

    welcomeMessage("Press left to zoom out\nright to zoom in");
    winMessage("Great Job");
  }

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
  else if (index == 12) {
    // Put a border around the level, and create a hero and destination
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 1, cy: 5, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { friction: 0.6 });
    h.role = new Hero();
    // The hero will be controlled explicitly via special touches, so give it
    // "explicit" movement.
    h.movement = new ExplicitMovement();

    cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    d.role = new Destination();

    game.score.setVictoryDestination(1);

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
    Helpers.addJoystickControl(game.hud,
      { cx: 1, cy: 8, width: 1.5, height: 1.5, img: "grey_ball.png" },
      { actor: h, scale: 5, stopOnUp: true });

    // We will now create four obstacles.  Two will use a red rectangle as their picture,
    // and two will use a purple ball.  In terms of physics, two will be boxes, two will be
    // circles.  The debug flag (see GameConfig.ts) causes outlines to draw, which reveal
    // the real shape, so we can see when it doesn't match the picture

    // This one looks like a purple ball, but its shape is a box.
    let boxCfg = { cx: 5, cy: 5, width: 0.75, height: 0.75, img: "purple_ball.png" };
    let fake_ball = new Actor(game.world);
    fake_ball.appearance = new ImageSprite(boxCfg);
    fake_ball.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { friction: 1 });
    fake_ball.role = new Obstacle();

    // This one looks like a ball, and it is a ball
    cfg = { cx: 7, cy: 2, radius: 0.4, width: 0.8, height: 0.8, img: "purple_ball.png" };
    let real_ball = new Actor(game.world);
    real_ball.appearance = new ImageSprite(cfg);
    real_ball.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { friction: 1 });
    real_ball.role = new Obstacle();

    // This one looks like a square, but it's really a ball
    cfg = { cx: 9, cy: 4, radius: 1.5, width: 3, height: 3, img: "noise.png" };
    let fake_box = new Actor(game.world);
    fake_box.appearance = new ImageSprite(cfg);
    fake_box.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { friction: 1 });
    fake_box.role = new Obstacle();

    // And finally, a box that looks like a box
    boxCfg = { cx: 9, cy: 7, width: 0.5, height: 2, img: "noise.png" };
    let real_box = new Actor(game.world);
    real_box.appearance = new ImageSprite(boxCfg);
    real_box.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { friction: 1 });
    real_box.role = new Obstacle();

    // I was a little bit deceptive with the fake_box, because I made the height
    // and width match the radius.  Look at what happens when the width and
    // height of the image aren't the same, but there's a radius.
    let oval_cfg = { cx: 13, cy: 3, width: 2, height: .5, radius: 1, img: "purple_ball.png" };
    let o3 = new Actor(game.world);
    o3.appearance = new ImageSprite(oval_cfg);
    o3.rigidBody = RigidBodyComponent.Circle(oval_cfg, game.world);
    o3.role = new Obstacle();

    // This one has a bigger body than its image
    cfg = { cx: 1, cy: 1, radius: 0.5, width: 0.8, height: 0.8, img: "purple_ball.png" };
    let big_hitbox = new Actor(game.world);
    big_hitbox.appearance = new ImageSprite(cfg);
    big_hitbox.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { friction: 1 });
    big_hitbox.role = new Obstacle();

    // This one has a smaller body than its image
    cfg = { cx: 8, cy: 1, radius: 0.25, width: 0.8, height: 0.8, img: "purple_ball.png" };
    let small_hitbox = new Actor(game.world);
    small_hitbox.appearance = new ImageSprite(cfg);
    small_hitbox.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { friction: 1 });
    small_hitbox.role = new Obstacle();

    // These alternate hitboxes also work for boxes, of course
    let small_hitbox2 = new Actor(game.world);
    small_hitbox2.appearance = new ImageSprite({ cx: 14, cy: 1, width: 0.7, height: 0.8, img: "noise.png" });
    small_hitbox2.rigidBody = RigidBodyComponent.Box({ cx: 14, cy: 1, width: 0.5, height: 0.6 }, game.world, { friction: 1 });
    small_hitbox2.role = new Obstacle();

    // The most powerful option is to make a polygon.  We can have as many
    // points as we want (but more than 8 is usually crazy), but the polygon
    // needs to be convex.  We provide the points in terms of their distance
    // from the center.  So, for example, here's a circular image with a
    // hexagonal body.
    let polyCfg = {
      cx: 3, cy: 3, width: 2, height: 2, img: "blue_ball.png",
      vertices: [-1, 0, -.5, .866, .5, .866, 1, 0, .5, -.866, -.5, -.866]
    };
    let oooo = new Actor(game.world);
    oooo.appearance = new ImageSprite(polyCfg);
    oooo.rigidBody = RigidBodyComponent.Polygon(polyCfg, game.world, { rotationSpeed: .25 });
    oooo.role = new Obstacle();

    winMessage("Great Job");

    // Remember how in level 11 we had a heads-up display (a HUD)?  Well a
    // Hud is just a lightweight scene, actually very similar to the "world"
    // in which we've been putting actors.  Lightweight scenes are very
    // powerful.  The HUD is special, because it overlays /on top of/ the
    // world.  But we can make stand-alone lightweight scenes, called
    // "Overlays", to show at the beginning of the level, the end, and when
    // pausing.  The welcomeMessage() function does just that: it tells
    // JetLag how to make an overlay to show before the level starts.  Let's
    // try it:

    // the "()=>{}" code says "this is the function that will create the
    // overlay".  It doesn't make the overlay yet... it just tells JetLag
    // how to make the overlay.  We call such code "callbacks"
    game.installOverlay((overlay: Scene) => {
      // We are going to put a big black button over the whole screen.
      // Clicking it will get rid of this overlay
      Helpers.addTapControl(overlay,
        { cx: 8, cy: 4.5, width: 16, height: 9, img: "black.png" },
        () => { game.clearOverlay(); return true; });
      // On top of the button, we will write some text, centered around the
      // center of the screen
      //
      // You might think it's weird that we're using a callback to create the
      // text.  It'll make more sense later.
      let t = new Actor(overlay);
      t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 },
        () => "An obstacle's appearance may\nnot match its physics");
      // Note that we are putting tap controls and text on 'overlay', but
      // we can still access world.  This means, for example, that you
      // could have a button that lets the user choose a character, and
      // then use world to add that character as the hero :)
    });
  }

  // This level plays around with physics a little bit, to show how friction and
  // elasticity can do interesting things.
  //
  // It also does some new tricks with the welcome scene overlay
  else if (index == 13) {
    // Put a border around the level, and create a hero and destination.  Control the hero
    // with a joystick
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 1, cy: 5, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new ExplicitMovement();

    cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // note: releasing the joystick no longer stops the hero
    Helpers.addJoystickControl(game.hud, { cx: 1, cy: 8, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5, stopOnUp: false });

    // These obstacles have interesting elasticity and friction values
    cfg = { cx: 4, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "purple_ball.png" };
    let bouncy = new Actor(game.world);
    bouncy.appearance = new ImageSprite(cfg);
    bouncy.role = new Obstacle();
    bouncy.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { elasticity: 100 });

    cfg = { cx: 4, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "purple_ball.png" };
    let heavy = new Actor(game.world);
    heavy.appearance = new ImageSprite(cfg);
    heavy.role = new Obstacle();
    heavy.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 10, friction: 100 });

    winMessage("Great Job");

    // On this welcome scene, we will have multiple texts, with different font
    // colors.  We will also have an image.  Lastly, the scene won't
    // disappear by clicking.  Instead, it will disappear after a few
    // seconds.  Note that the timer for dismissing is a callback within a
    // callback
    game.installOverlay((overlay: Scene) => {
      let opts = { cx: 8, cy: 4.5, width: 16, height: 9, img: "black.png" };
      let c = new Actor(overlay);
      c.appearance = new ImageSprite(opts);
      c.rigidBody = RigidBodyComponent.Box(opts, overlay);
      let t = new Actor(overlay);
      t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 },
        () => "Obstacles can have different amounts\nof friction and elasticity");
      let t2 = new Actor(overlay);
      t2.appearance = new TextSprite({ cx: 0.5, cy: 0.5, center: false, face: "Arial", color: "#00FFFF", size: 16, z: 0 },
        () => "(Releasing the joystick does not stop the hero anymore)");
      overlay.timer.addEvent(new TimedEvent(4, false, () => game.clearOverlay()));
    });
  }

  // This level introduces goodies. Goodies are something that we collect.  We
  // can make the collection of goodies lead to changes in the behavior of the
  // game.  In this example, the collection of goodies "enables" a destination.
  else if (index == 14) {
    // set up a hero, destination, bounding box, and joystick
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 1, cy: 5, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 2, friction: 0.6 });
    h.movement = new ExplicitMovement();

    cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    // There are four "types" of goodies in JetLag, meaning we have four
    // different scores.  We'll say that the destination won't accept heroes
    // until the score is at least 2,0,0,0.  We achieve this by adding a bit of
    // code to the destination.  The code will run whenever a hero collides with
    // the destination, and returns true only if we want to let the hero in.
    d.role = new Destination({ onAttemptArrival: () => { return game.score.goodieCount[0] >= 2; } });

    game.score.setVictoryDestination(1);
    Helpers.addJoystickControl(game.hud, { cx: 1, cy: 8, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5 });

    // Add some stationary goodies.
    //
    // Note that the default is for goodies to not cause a change in the hero's
    // movement at the time when a collision occurs... this is often called
    // being a "sensor"
    //
    // Note that JetLag tracks four different scores for goodies.  By default,
    // collecting a goodie increases the "first" score by 1.
    cfg = { cx: 2, cy: 2, radius: 0.25, width: 0.5, height: 0.5, img: "blue_ball.png" };
    let g = new Actor(game.world);
    g.appearance = new ImageSprite(cfg);
    g.role = new Goodie();
    g.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    cfg = { cx: 6, cy: 6, radius: 0.25, width: 0.5, height: 0.5, img: "blue_ball.png" };
    let g2 = new Actor(game.world);
    g2.appearance = new ImageSprite(cfg);
    g2.role = new Goodie();
    g2.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    // let's put a display on the screen to see how many goodies we've
    // collected. This shows why we want a callback for specifying the text to
    // put on the screen
    let t = new Actor(
      game.hud);
    t.appearance = new TextSprite({ cx: 0.25, cy: .25, center: false, face: "Arial", color: "#FF00FF", size: 20, z: 2 },
      () => game.score.goodieCount[0] + "/2 Goodies");

    welcomeMessage("You must collect two blue balls.\nThen the destination will work");

    // Set up a win scene that also plays a sound.  This should look familiar.
    // And, as you can imagine, we can do lose scenes too.
    game.score.winSceneBuilder = (overlay: Scene) => {
      Helpers.addTapControl(overlay,
        { cx: 8, cy: 4.5, width: 16, height: 9, img: "black.png" },
        () => { game.switchTo(game.config.levelBuilder, 15); return true; });
      let t = new Actor(overlay);
      t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 },
        () => "Great Job");
      game.musicLibrary.getSound("win_sound.ogg").play();
    };
  }

  // Earlier, we saw that enemies could move along a path. So can any other
  // actor, so we'll move destinations, goodies, and obstacles, too.
  else if (index == 15) {
    // start with a hero who is controlled via Joystick
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 1, cy: 3, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.role = new Hero();
    h.movement = new ExplicitMovement();

    Helpers.addJoystickControl(game.hud, { cx: 1, cy: 8, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5 });

    // make a destination that moves, and that requires one goodie to be collected before it
    // works
    cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    d.role = new Destination({ onAttemptArrival: () => { return game.score.goodieCount[0] >= 1; } });
    d.movement = new PathMovement(new Path().to(15, 8).to(15, 0.25).to(15, 8), 4, true);
    game.score.setVictoryDestination(1);

    // make an obstacle that moves
    let boxCfg = { cx: 0, cy: 0, width: 1, height: 1, img: "purple_ball.png" };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(boxCfg);
    o.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { elasticity: 100 });
    o.role = new Obstacle();
    o.movement = new PathMovement(new Path().to(0, 0).to(8, 8).to(0, 0), 2, true);

    // make a goodie that moves
    cfg = { cx: 5, cy: 5, radius: 0.25, width: 0.5, height: 0.5, img: "blue_ball.png" };
    let g = new Actor(game.world);
    g.appearance = new ImageSprite(cfg);
    g.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    g.role = new Goodie();
    g.movement = new PathMovement(new Path().to(3, 3).to(6, 3).to(6, 6).to(3, 6).to(3, 3), 10, true);

    // draw a goodie counter in light blue (60, 70, 255) with a 12-point font
    let t = new Actor(
      game.hud);
    t.appearance = new TextSprite({ cx: 1, cy: 1, center: false, face: "Arial", color: "#3C46FF", size: 12, z: 2 },
      () => game.score.goodieCount[0] + " Goodies");

    welcomeMessage("Every actor can move...");
    winMessage("Great Job");
  }

  // Sometimes, we don't want a destination, we just want to say that the player
  // wins by collecting enough goodies.  This level also shows that we can set a
  // time limit for the level, and we can pause the game.
  else if (index == 16) {
    // Set up a hero who is controlled by the joystick
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new ExplicitMovement();

    Helpers.addJoystickControl(
      game.hud,
      { cx: 1, cy: 8, width: 1.5, height: 1.5, img: "grey_ball.png" },
      { actor: h, scale: 5 }
    );

    // draw 5 goodies
    for (let p = 0; p < 5; p++) {
      cfg = { cx: p + 1, cy: p + 4, radius: 0.125, width: 0.25, height: 0.25, img: "blue_ball.png" };
      let g = new Actor(game.world);
      g.appearance = new ImageSprite(cfg);
      g.role = new Goodie();
      g.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    }

    // indicate that we win by collecting enough goodies
    game.score.setVictoryGoodies(5, 0, 0, 0);

    // put the goodie count on the screen
    let t = new Actor(
      game.hud);
    t.appearance = new TextSprite({ cx: .25, cy: .25, center: false, face: "Arial", color: "#3C46FF", size: 14, z: 2 },
      () => game.score.goodieCount[0] + "/5 Goodies");

    // put a simple countdown on the screen.  The first line says "15 seconds", the second
    // actually draws something on the screen showing remaining time
    game.score.loseCountDownRemaining = 15;
    t = new Actor(game.world);
    t.appearance = new TextSprite({ cx: .25, cy: 1.25, center: false, face: "Arial", color: "#000000", size: 32, z: 2 }, () =>
      (game.score.loseCountDownRemaining ?? 0).toFixed(0));

    // let's also add a screen for pausing the game. In a real game, every level
    // should have a button for pausing the game, and the pause scene should
    // have a button for going back to the main menu... we'll show how to do
    // that later.
    //
    // The way this works is it says "draw a button that, when pressed, tells
    // JetLag how to draw a pause scene".  Whenever JetLag sees that it's
    // possible to draw a pause scene, it will draw it, so this will cause the
    // game to switch to a pause scene until the overlay gets dismissed
    Helpers.addTapControl(game.hud, { cx: 15, cy: 3, width: 1, height: 1, img: "pause.png" }, (): boolean => {
      game.installOverlay((overlay: Scene) => {
        Helpers.addTapControl(
          overlay,
          { cx: 8, cy: 4.5, width: 16, height: 9, img: "black.png" },
          () => { game.clearOverlay(); return true; }
        );
        let t = new Actor(
          overlay);
        t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#FFFFFF", size: 32, z: 0 },
          () => "Game Paused");
      });
      return true;
    });

    welcomeMessage("Collect all blue balls to win");
    loseMessage("Time Up");
    winMessage("Great Job");
  }

  // This level shows how we can put sensors into the game.  Sensors notice when
  // an actor collides with them, and they run some code as a result. In this
  // specific case, we'll have the sensors modify the hero's velocity.
  //
  // This level also adds a stopwatch. Stopwatches don't have any effect on
  // gameplay yet.
  //
  // This level also has a Pause scene.
  else if (index == 17) {
    // start with a hero who is controlled via tilt, and a destination
    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 3, cy: 3, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let dest = new Actor(game.world);
    dest.appearance = new ImageSprite(cfg);
    dest.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    dest.role = new Destination();

    game.score.setVictoryDestination(1);

    // Make the stopwatch start counting, by giving it an initial value of 0
    // Then draw the stopwatch value onto the HUD
    game.score.stopWatchProgress = 0;
    let t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 0.1, cy: 0.1, center: false, face: "Arial", color: "#000000", size: 32, z: 2 }, () =>
      (game.score.stopWatchProgress ?? 0).toFixed(0) + " seconds");

    // Put a button on the HUD to pause the game
    Helpers.addTapControl(game.hud, { cx: 1, cy: 8, width: 0.4, height: 0.4, img: "pause.png" }, () => {
      // When the button is pressed, draw an overlay scene
      game.installOverlay((overlay: Scene) => {
        // The scene should have a full-screen background.  Pressing it should
        // resume the game.
        Helpers.addTapControl(
          overlay,
          { cx: 8, cy: 4.5, width: 16, height: 9, img: "noise.png" },
          () => { game.clearOverlay(); return true; }
        );
        // Put some text on the pause scene
        let t = new Actor(
          overlay);
        t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#000000", size: 32, z: 0 },
          () => "Game Paused");
        // Add a button for going back to the main menu
        Helpers.addTapControl(
          overlay,
          { cx: 15.5, cy: .5, width: 0.4, height: 0.4, img: "back_arrow.png" },
          () => {
            game.clearOverlay();
            game.switchTo(game.config.splashBuilder, 1);
            return true;
          }
        );
      });
      return true;
    });

    // Now draw three sensors, with different "pad" effects.  Note that the
    // Z-index completely controls if the hero goes over or under two of these.
    // For the third, an index of 0 (the default), coupled with it being drawn
    // after the hero, means the hero still goes under it

    // We can make a function right here in the code, and use it to produce the
    // functions the pads will run.
    function padMaker(factor: number) {
      // register a callback to multiply the hero's speed by factor
      return (_self: Actor, h: Actor) => {
        h.rigidBody!.setVelocity(h.rigidBody!.getVelocity().Scale(factor));
      };
    }

    // This pad effect multiplies by -1, causing a "bounce off" effect
    cfg = { cx: 5, cy: 3, radius: 0.4, width: 0.8, height: 0.8, img: "purple_ball.png" };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(cfg);
    o.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    o.role = new Sensor(padMaker(-10));

    // This pad multiplies by five, causing a speedup
    cfg = { cx: 7, cy: 3, radius: 0.4, width: 0.8, height: 0.8, img: "purple_ball.png" };
    o = new Actor(game.world);
    o.appearance = new ImageSprite(cfg);
    o.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    o.role = new Sensor(padMaker(5));

    // A fraction causes a slowdown, and we'll make this one spin
    cfg = { cx: 9, cy: 3, width: 0.8, height: 0.8, radius: 0.4, img: "purple_ball.png" };
    o = new Actor(game.world);
    o.appearance = new ImageSprite(cfg);
    o.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { rotationSpeed: 2 });
    o.role = new Sensor(padMaker(0.2));

    welcomeMessage("Obstacles as zoom, strips, friction pads, " + "and repellers");
    winMessage("Great Job");
  }

  // This level shows that it is possible to give heroes and enemies different
  // strengths, so that a hero doesn't disappear after a single collision. It
  // also shows that when an enemy defeats a hero, we can customize the message
  // that prints
  else if (index == 18) {
    // set up a basic world.  Tilt will control one enemy, and also the hero
    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 15, cy: 8, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // draw a hero and give it strength of 10. The default is for enemies to
    // have "2" units of damage, and heroes to have "1" unit of strength, so
    // that any collision defeats the hero without removing the enemy.
    cfg = { cx: 0.25, cy: 5.25, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();
    h.role = new Hero({ strength: 10 });

    // draw a strength meter to show this hero's strength
    let t = new Actor(
      game.world);
    t.appearance = new TextSprite({ cx: 0.5, cy: .5, center: false, face: "Arial", color: "#000000", size: 32, z: 2 },
      () => (h.role as Hero).strength + " Strength");

    // Make a custom lose scene, that makes use of this variable called endText.
    // The trick here is that our code can change endText to say other things
    let endText = "Try Again";
    game.score.loseSceneBuilder = (overlay: Scene) => {
      Helpers.addTapControl(
        overlay,
        { cx: 8, cy: 4.5, width: 16, height: 9, img: "black.png" },
        () => { game.switchTo(game.config.levelBuilder, 18); return true; }
      );
      let t = new Actor(
        overlay);
      t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 },
        () => endText);
    };

    // Each enemy will get an "onDefeatHero" callback, which will run if that
    // hero is the one who defeats the hero.  The callbacks will just change the
    // endText, so that the lose screen will display different messages.
    // Notice, too, that we are going to make it so that hero collisions with
    // enemies don't cause the hero to bounce.

    // our first enemy stands still:
    cfg = { cx: 8, cy: 8, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1.0, elasticity: 0.3, friction: 0.6, rotationSpeed: 1 });
    e.role = new Enemy({ damage: 4, onDefeatHero: () => { endText = "How did you hit me?"; }, disableHeroCollision: true });

    // our second enemy moves along a path
    cfg = { cx: 7, cy: 7, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
    e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.role = new Enemy({ damage: 4, onDefeatHero: () => { endText = "Stay out of my way!"; }, disableHeroCollision: true });
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1.0, elasticity: 0.3, friction: 0.6 });
    e.movement = new PathMovement(new Path().to(7, 7).to(7, 1).to(7, 7), 2, true);

    // our third enemy moves with tilt, which makes it hardest to avoid
    cfg = { cx: 15, cy: 1, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
    e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.role = new Enemy({ damage: 4, onDefeatHero: () => { endText = "You can't run away from me!"; }, disableHeroCollision: true });
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 15, elasticity: 0.3, friction: 0.6 });
    e.movement = new TiltMovement();

    // be sure when testing this level to lose, with each enemy being the last the hero
    // collides with, so that you can see the different messages
    welcomeMessage("The hero can defeat up to two enemies...");
    winMessage("Great Job");
  }

  // This level shows that we can win a level by defeating all enemies.  It also
  // shows that we can put a time limit on a level
  else if (index == 19) {
    // start with a hero who is controlled via Joystick
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    // Give the hero enough strength to beat the enemies
    h.role = new Hero({ strength: 5 });
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new ExplicitMovement();
    Helpers.addJoystickControl(game.hud, { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5 });

    // draw two enemies.  Remember, each does 2 units of damage
    cfg = { cx: 6, cy: 6, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
    let e1 = new Actor(game.world);
    e1.appearance = new ImageSprite(cfg);
    e1.role = new Enemy();
    e1.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    cfg = { cx: 15, cy: 1, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
    let e2 = new Actor(game.world);
    e2.appearance = new ImageSprite(cfg);
    e2.role = new Enemy();
    e2.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    // Start a countdown with 10 seconds, and put a timer on the HUD
    game.score.loseCountDownRemaining = 10;
    let t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 0.1, cy: 8.5, center: false, face: "Arial", color: "#000000", size: 32, z: 2 }, () =>
      (game.score.loseCountDownRemaining ?? 0).toFixed(0));

    // indicate that defeating all of the enemies is the way to win this level
    game.score.setVictoryEnemyCount();

    welcomeMessage("You have 10 seconds to defeat the enemies");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level shows that a goodie can change the hero's strength, and that we
  // can win by defeating a specific number of enemies, instead of all enemies.
  else if (index == 20) {
    // start with a hero who is controlled via Joystick
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new ExplicitMovement();
    Helpers.addJoystickControl(game.hud, { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5 });

    // draw an enemy.  By default, it does 2 units of damage.  If it disappears,
    // it will make a sound
    cfg = { cx: 10, cy: 6, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.role = new Enemy({ onDefeated: (_e: Actor, _h?: Actor) => { game.musicLibrary.getSound("slow_down.ogg").play(); } });
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    // draw another enemy.  It is too deadly for us to ever defeat.
    cfg = { cx: 7, cy: 7, radius: 1, width: 2, height: 2, img: "red_ball.png" };
    let e2 = new Actor(game.world);
    e2.appearance = new ImageSprite(cfg);
    e2.role = new Enemy({ damage: 100 });
    e2.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    // this goodie gives an extra "2" units of strength:
    cfg = { cx: 14, cy: 7, radius: 0.25, width: 0.5, height: 0.5, img: "blue_ball.png" };
    let g = new Actor(game.world);
    g.appearance = new ImageSprite(cfg);
    g.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    g.role = new Goodie({
      onCollect: (_g: Actor, h: Actor) => {
        game.musicLibrary.getSound("woo_woo_woo.ogg").play();
        (h.role as Hero).strength = 2 + (h.role as Hero).strength;
        return true;
      }
    });

    // Display the hero's strength
    let t = new Actor(
      game.hud);
    t.appearance = new TextSprite({ cx: 0.1, cy: 8.5, center: false, face: "Arial", color: "#000000", size: 32, z: 2 },
      () => (h.role as Hero).strength + " Strength");

    // win by defeating one enemy
    game.score.setVictoryEnemyCount(1);

    // Change the text that appears on the scene when we win the level
    winMessage("Good enough...");
    loseMessage("Try Again");
    welcomeMessage("Collect blue balls to increase strength\n" + "Defeat one enemy to win");
  }

  // this level introduces the idea of invincibility. Collecting the goodie
  // makes the hero invincible for a little while...
  else if (index == 21) {
    // start with a hero who is controlled via Joystick
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new ExplicitMovement();
    Helpers.addJoystickControl(
      game.hud,
      { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" },
      { actor: h, scale: 5 }
    );

    // draw a few enemies, and make them rotate
    for (let i = 0; i < 5; ++i) {
      cfg = { cx: i + 4, cy: 6, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
      let e = new Actor(game.world);
      e.appearance = new ImageSprite(cfg);
      e.role = new Enemy();
      e.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1.0, elasticity: 0.3, friction: 0.6, rotationSpeed: 1 });
    }

    // this goodie makes the hero invincible
    cfg = { cx: 15, cy: 8, radius: 0.25, width: 0.5, height: 0.5, img: "blue_ball.png" };
    let g = new Actor(game.world);
    g.appearance = new ImageSprite(cfg);
    g.role = new Goodie({
      onCollect: (_g: Actor, h: Actor) => {
        // Note that we *add* 15 seconds, instead of just setting it to 15, in
        // case there was already some invincibility
        (h.role as Hero).invincibleRemaining = ((h.role as Hero).invincibleRemaining + 15);
        return true;
      }
    });
    g.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { rotationSpeed: .25 });
    g.movement = new PathMovement(new Path().to(15, 8).to(10, 3).to(15, 8), 5, true);

    // We'll require 5 enemies to be defeated before the destination works
    cfg = { cx: 15, cy: 1, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    d.role = new Destination({ onAttemptArrival: () => { return game.score.getEnemiesDefeated() >= 5; } });
    game.score.setVictoryDestination(1);

    // display a goodie count for type-1 goodies.  This shows that the count
    // doesn't increase, since we provided an 'onCollect' that didn't increase
    // the count.
    let t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 0.1, cy: .5, center: false, face: "Arial", color: "#3C46FF", size: 16, z: 2 },
      () => game.score.goodieCount[0] + " Goodies");

    // Show how much invincibility is remaining
    t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 0.1, cy: 1, center: false, face: "Arial", color: "#3C46FF", size: 16, z: 2 },
      () => (h.role as Hero).invincibleRemaining.toFixed(0) + " Invincibility");

    // put a frames-per-second display on the screen.
    t = new Actor(
      game.hud);
    t.appearance = new TextSprite({ cx: 0.1, cy: 1.5, center: false, face: "Arial", color: "#C8C864", size: 16, z: 2 },
      () => game.renderer.getFPS().toFixed(0) + " fps");

    welcomeMessage("The blue ball will make you invincible for 15 seconds");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // We can make goodies "count" for more than one point... they can even count
  // for negative points.
  else if (index == 22) {
    // start with a hero who is controlled via Joystick
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new ExplicitMovement();

    Helpers.addJoystickControl(game.hud, { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5 });

    // Set up a destination that requires 7 type-1 goodies
    cfg = { cx: 15, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination({ onAttemptArrival: () => { return game.score.goodieCount[0] >= 7; } });
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // This goodie **reduces** your score
    cfg = { cx: 9, cy: 1, radius: 0.25, width: 0.5, height: 0.5, img: "blue_ball.png" };
    let badGoodie = new Actor(game.world);
    badGoodie.appearance = new ImageSprite(cfg);
    badGoodie.role = new Goodie({ onCollect: () => { game.score.goodieCount[0] -= 2; return true; } });
    badGoodie.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    // This goodie **increases** your score
    cfg = { cx: 9, cy: 6, radius: 0.25, width: 0.5, height: 0.5, img: "blue_ball.png" };
    let goodGoodie = new Actor(game.world);
    goodGoodie.appearance = new ImageSprite(cfg);
    goodGoodie.role = new Goodie({ onCollect: () => { game.score.goodieCount[0] += 9; return true; } });
    goodGoodie.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    // print a goodie count to show how the count goes up and down
    let t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 7, cy: 8.5, center: false, face: "Arial", color: "#3C46FF", size: 18, z: 2 },
      () => "Your score is: " + game.score.goodieCount[0]);

    welcomeMessage("Collect 'the right' blue balls to activate destination");
    winMessage("Great Job");
  }

  // this level demonstrates that we can drag actors (in this case,
  // obstacles), and that we can make rotated obstacles. The latter could be
  // useful for having angled walls in a maze
  else if (index == 23) {
    // start with a hero who is controlled via tilt, and a destination
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    Helpers.enableTilt(10, 10);
    let cfg = { cx: 0.25, cy: 5.25, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    cfg = { cx: 15, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // Create a "drag zone": a region on the HUD that accepts finger drag gestures
    Helpers.createDragZone(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" });

    // draw two obstacles that we can drag
    let boxCfg = { cx: 15, cy: 2, width: 0.75, height: 0.75, img: "purple_ball.png" };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(boxCfg);
    o.role = new Obstacle();
    o.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { elasticity: 1 });
    o.movement = new Draggable(true);

    boxCfg = { cx: 14, cy: 1, width: 0.75, height: 0.75, img: "purple_ball.png" };
    let o2 = new Actor(game.world);
    o2.appearance = new ImageSprite(boxCfg);
    o2.role = new Obstacle();
    o2.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { elasticity: 1 });
    o2.movement = new Draggable(true);

    // draw an obstacle that is oblong (due to its width and height) and that is rotated.
    // Note that this should be a box, or it will not have the right underlying shape.
    boxCfg = { cx: 3, cy: 3, width: 0.75, height: 0.15, img: "purple_ball.png" };
    o = new Actor(game.world);
    o.appearance = new ImageSprite(boxCfg);
    o.role = new Obstacle();
    o.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);
    o.rigidBody.setRotation(Math.PI / 4);
    // This one is draggable, but we pass in "false", so when the hero hits into
    // it, it will be affected.
    o.movement = new Draggable(false);

    welcomeMessage("More obstacle tricks, including one that can be dragged");
    winMessage("Great Job");
  }

  // This level shows how we can use "poking" to move obstacles. In this case,
  // pressing an obstacle selects it, and pressing the screen moves the obstacle
  // to that location. Double-tapping an obstacle removes it.
  else if (index == 24) {
    // start with a hero who is controlled via Joystick, and a destination
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new ExplicitMovement();

    cfg = { cx: 15, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // draw a picture on the -1 plane, so it is a background behind the hero and
    // destination
    let background = new Actor(game.world);
    background.appearance = new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "noise.png", z: -1 });

    // make a few obstacles that we can poke
    let boxCfg = { cx: 14, cy: 1, width: 0.25, height: 2, img: "purple_ball.png" };
    let vertical_obstacle = new Actor(game.world);
    vertical_obstacle.appearance = new ImageSprite(boxCfg);
    vertical_obstacle.role = new Obstacle();
    vertical_obstacle.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { elasticity: 100 });

    // JetLag doesn't understand "double tap", so we implement it ourselves by
    // tracking each time a tap happens.
    let lastTouch = 0;
    // Track the actor most recently tapped
    let lastTapActor: Actor | undefined = undefined;
    // Now we can say what to do when the vertical obstacle is tapped:
    vertical_obstacle.gestures = {
      tap: () => {
        // Get the time of the last tap to the screen
        let x = game.renderer.now;
        // If it's been less than 300 milliseconds, and if this is the second
        // consecutive tap to the vertical obstacle, remove it
        if (x - lastTouch < 300 && lastTapActor == vertical_obstacle) {
          vertical_obstacle.remove(true);
          return true;
        }
        // Otherwise, remember the time of the tap, and that it was to the
        // vertical obstacle
        lastTouch = x;
        lastTapActor = vertical_obstacle;
        // The poke-to-place zone is going to look for "selected_entity", so
        // make sure it is vertical_obstacle.
        game.storage.setLevel("selected_entity", vertical_obstacle);
        return true;
      }
    };
    Helpers.createPokeToPlaceZone(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" });

    boxCfg = { cx: 14, cy: 2, width: 2, height: 0.25, img: "purple_ball.png" };
    let horizontal_obstacle = new Actor(game.world);
    horizontal_obstacle.appearance = new ImageSprite(boxCfg);
    horizontal_obstacle.role = new Obstacle();
    horizontal_obstacle.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { elasticity: 100 });
    // We can write the code more succinctly the second time around...
    horizontal_obstacle.gestures = {
      tap: () => {
        let x = game.renderer.now;
        if (x - lastTouch < 300 && lastTapActor == horizontal_obstacle) {
          horizontal_obstacle.remove(true);
          return true;
        }
        lastTouch = x;
        lastTapActor = horizontal_obstacle;
        game.storage.setLevel("selected_entity", horizontal_obstacle);
        return true;
      }
    };

    // Note that we need to make the joystick *after* the pokeToPlaceZone,
    // or else our interaction with the zone will prevent the joystick from
    // working
    Helpers.addJoystickControl(
      game.hud,
      { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" },
      { actor: h, scale: 5 }
    );

    welcomeMessage("Touch an obstacle to select it, then touch the " + "screen to move it\n (double-touch to remove)");
    winMessage("Great Job");
  }

  // In this level, the enemy chases the hero
  else if (index == 25) {
    // start with a hero who is controlled via Joystick, and a destination
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new ExplicitMovement();

    Helpers.addJoystickControl(game.hud,
      { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" },
      { actor: h, scale: 5 }
    );

    cfg = { cx: 14, cy: 2, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // draw a picture late within this block of code, but still cause the picture to be
    // drawn behind everything else by giving it a z index of -2
    let background = new Actor(game.world);
    background.appearance = new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "noise.png", z: -2 });

    // create an enemy who chases the hero
    // Note: z is -2, but it was drawn after the noise, so we can still see it
    let zCfg = { z: -2, cx: 15, cy: 1, radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png", };
    let e3 = new Actor(game.world);
    e3.appearance = new ImageSprite(zCfg);
    e3.role = new Enemy();
    e3.rigidBody = RigidBodyComponent.Circle(zCfg, game.world, { density: 0.1, elasticity: 0.3, friction: 0.6 });
    e3.movement = new BasicChase(1, h, true, true);

    welcomeMessage("The enemy will chase you");
    winMessage("Good Job");
    loseMessage("Try Again");
  }

  // Sounds are an important part of games.  Here, we'll make an obstacle play
  // sounds when we collide with it or tap it
  else if (index == 26) {
    // start with a hero who is controlled via Joystick, and a destination
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new ExplicitMovement();

    Helpers.addJoystickControl(game.hud,
      { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" },
      { actor: h, scale: 5 }
    );

    cfg = { cx: 14, cy: 2, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // set up our obstacle so that collision and touch make it play sounds
    cfg = { cx: 5, cy: 5, width: 0.8, height: 0.8, radius: 0.4, img: "purple_ball.png" };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(cfg);
    o.role = new Obstacle({ heroCollision: () => game.musicLibrary.getSound("high_pitch.ogg").play() });
    o.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1, friction: 1 });

    let tapHandler = () => {
      game.musicLibrary.getSound("low_pitch.ogg").play();
      return true;
    };
    o.gestures = { tap: tapHandler };

    welcomeMessage("Touch the purple ball or collide with it, and a " + "sound will play");
    winMessage("Great Job");
  }

  // This hero rotates so that it faces in the direction of movement. This can
  // be useful in games where the perspective is from overhead, and the hero is
  // moving in any X or Y direction
  else if (index == 27) {
    // set up a hero who rotates in the direction of movement, and is controlled by joystick
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "leg_star_1.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new ExplicitMovement({ rotateByDirection: true });

    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });
    Helpers.addJoystickControl(game.hud,
      { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" },
      { actor: h, scale: 5 }
    );

    // We won't add a destination... instead, the level will end in victory after 25 seconds
    game.score.winCountRemaining = 25;
    let t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 0.1, cy: 8.5, center: false, face: "Arial", color: "#000000", size: 32, z: 2 }, () =>
      (game.score.winCountRemaining ?? 0).toFixed(0));

    // Let's have an enemy, too
    cfg = { cx: 8, cy: 4.5, radius: 1, width: 2, height: 2, img: "red_ball.png" };
    let bigEnemy = new Actor(game.world);
    bigEnemy.appearance = new ImageSprite(cfg);
    bigEnemy.role = new Enemy();
    bigEnemy.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    welcomeMessage("The star rotates in the direction of movement");
    winMessage("You Survived!");
    loseMessage("Try Again");
  }

  // This level shows two things. The first is that a custom motion path can
  // allow things to violate the laws of physics and pass through other things.
  // The second is that motion paths can go off-screen.
  else if (index == 28) {
    // set up a hero who rotates in the direction of movement, and is controlled by joystick
    let cfg = { cx: 8, cy: 4.25, width: 0.8, height: 0.8, radius: 0.4, img: "leg_star_1.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new ExplicitMovement({ rotateByDirection: true });

    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });
    Helpers.addJoystickControl(game.hud,
      { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" },
      { actor: h, scale: 5 }
    );

    // the destination is right below the hero
    cfg = { cx: 8, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // this enemy starts from off-screen... you've got to be quick to survive!
    cfg = { cx: 8, cy: -8, radius: 4, width: 8, height: 8, img: "red_ball.png" };
    let big_enemy = new Actor(game.world);
    big_enemy.appearance = new ImageSprite(cfg);
    big_enemy.role = new Enemy();
    big_enemy.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    big_enemy.movement = new PathMovement(new Path().to(8, -8).to(8, 4.5).to(8, -8), 6, true);

    welcomeMessage("Reach the destination to win the level.");
    winMessage("Great Job");
    loseMessage("Ha Ha Ha");
  }

  // This level shows that we can draw on the screen to create obstacles.
  else if (index == 29) {
    // Set up a hero and destination, and turn on tilt
    let cfg = { cx: 8, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "leg_star_1.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });
    Helpers.enableTilt(10, 10);
    cfg = { cx: 8, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // Here's a function that draws a purple ball at x,y
    let make = (hudCoords: { x: number, y: number }): boolean => {
      // Always convert the hud coordinates to world coordinates
      let pixels = Helpers.overlayToWorldCoords(game.hud, hudCoords.x, hudCoords.y);
      cfg = { cx: pixels.x, cy: pixels.y, radius: .25, width: .5, height: .5, img: "purple_ball.png" };
      let o = new Actor(game.world);
      o.appearance = new ImageSprite(cfg);
      o.role = new Obstacle();
      o.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { elasticity: 2 });
      // Let's make it disappear quietly after 10 seconds...
      game.world.timer.addEvent(new TimedEvent(10, false, () => o.remove(true)));
      return true;
    };
    // "Pan" means "drag", more or less.  It has three parts: the initial
    // downpress, the drag, and the release.  Let's say that whenever anyone
    // drags anywhere on the screen, we'll call "make"
    Helpers.addPanCallbackControl(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, make, make, make);
    welcomeMessage("Draw on the screen\nto make obstacles appear");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level shows that we can "flick" things to move them. Notice that we do
  // not enable tilt. Instead, we specified that there is a default gravity in
  // the Y dimension pushing everything down. This is much like gravity on
  // earth. The only way to move things, then, is by flicking them.
  else if (index == 30) {
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // This is new: we'll create a level with a constant force downward in the Y
    // dimension
    Helpers.resetGravity(0, 10);

    // draw a destination
    let cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // create a hero that can be flicked
    cfg = { cx: 1, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6, disableRotation: true });
    h.movement = new FlickMovement(1);

    // A "flick zone" will receive swipe gestures and apply them directly to the
    // actor whose movement is "FlickMovement" and whose position is the start
    // point of the swipe.
    Helpers.createFlickZone(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" });

    // create an obstacle that can be flicked
    cfg = { cx: 6, cy: 6, width: 0.8, height: 0.8, radius: 0.4, img: "purple_ball.png" };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(cfg);
    o.role = new Obstacle();
    o.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    o.movement = new FlickMovement(0.5);

    welcomeMessage("Flick the hero to the destination");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level introduces a new concept: scrolling in the X dimension. We have
  // a constant force in the  Y direction, and now we say that tilt can produce
  // forces in X but not in Y. Thus we can tilt to move the hero left/right.
  // Note, too, that the hero will fall to the floor, since there is a constant
  // downward force, but there is not any mechanism to apply a Y force to make
  // it move back up.
  else if (index == 31) {
    // make a long level but not a tall level, and provide a constant downward force:
    game.world.camera.setBounds(3 * 16, 9);
    Helpers.resetGravity(0, 10);
    // turn on tilt, but only in the X dimension
    Helpers.enableTilt(10, 0);

    Helpers.drawBoundingBox(0, 0, 3 * 16, 9, .1, { density: 1, friction: 1 });

    // Add a hero and destination
    let cfg = { cx: 0.25, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    cfg = { cx: 47, cy: 8.25, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // This is very important: we need the camera to follow the hero, or it will
    // go off screen.
    game.world.camera.setCameraChase(h);

    // When you test this level, it's going to be hard to see that the ball is
    // actually moving.  If you have the "Developer Console" open, you can tap
    // the screen to see how the "world touch" coordinates are changing

    welcomeMessage("Side scroller with tilt");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // In the previous level, it was hard to see that the hero was moving.  We can
  // make a background layer to remedy this situation. Notice that the
  // background uses transparency to show the blue color for part of the screen
  else if (index == 32) {
    // Start with a repeat of the previous level
    game.world.camera.setBounds(128, 9);
    Helpers.resetGravity(0, 10);
    Helpers.enableTilt(10, 0);
    Helpers.drawBoundingBox(0, 0, 128, 9, .1, { density: 1, friction: 1 });
    let cfg = { cx: 0.25, cy: 7.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    cfg = { cx: 127, cy: 8.25, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);
    game.world.camera.setCameraChase(h);

    // Paint the background blue
    game.backgroundColor = 0x17b4ff;

    // put in a picture that auto-tiles, and that moves with velocity "0"
    // relative to the movement of the hero (on whom the camera focuses).  This
    // will simply tile the background.  Note that background layers don't work
    // nicely with zoom.
    //
    // Note that background "layers" are all drawn *before* anything that is
    // drawn with a z index... so the background will be behind the hero
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // make an obstacle that hovers in a fixed place. Note that hovering and
    // zoom do not work together nicely.
    cfg = { cx: 8, cy: 1, radius: 0.5, width: 1, height: 1, img: "blue_ball.png" };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(cfg);
    o.role = new Obstacle();
    o.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    o.movement = new HoverMovement(8, 1);

    // Add some text on the HUD to show how far the hero has traveled
    let t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 0.1, cy: 8.5, center: false, face: "Arial", color: "#FF00FF", size: 16, z: 2 },
      () => Math.floor(h.rigidBody?.getCenter().x ?? 0) + " m");

    // Add some text about the previous best score.  Notice that it's not on the
    // HUD, so we only see it when the hero is at the beginning of the level
    t = new Actor(game.world);
    t.appearance = new TextSprite({ cx: 0.1, cy: 8, center: false, face: "Arial", color: "#000000", size: 12, z: 0 },
      () => "best: " + (game.storage.getPersistent("HighScore32") ?? "0") + "M");

    welcomeMessage("Side Scroller with basic repeating background");
    // when this level ends, we save the best game.score. Once the score is
    // saved, it is saved permanently on the phone. Note that we could run a
    // callback on losing the level, too
    winMessage("Great Job", () => {
      // Get the hero distance at the end of the level... it's our score
      let new_score = Math.ceil(h.rigidBody?.getCenter().x ?? 0);
      // We read the previous best score, which we saved as "HighScore32".
      // Remember that "Persistent" facts never go away, even when we quit the
      // game
      let oldBest = parseInt(game.storage.getPersistent("HighScore32") ?? "0");
      if (oldBest < new_score)
        // If our new score is higher, then save it
        game.storage.setPersistent("HighScore32", new_score + "");
    });
    loseMessage("Try Again");
  }

  // Now let's look at how to add multiple background layers.  Also, let's add
  // jumping
  else if (index == 33) {
    // Start like in the previous level
    game.world.camera.setBounds(128, 9);
    Helpers.resetGravity(0, 10);
    Helpers.enableTilt(10, 0);
    Helpers.drawBoundingBox(0, 0, 128, 9, .1, { density: 1, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero({ jumpSound: "flap_flap.ogg" });
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    cfg = { cx: 127, cy: 8.25, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);
    game.world.camera.setCameraChase(h);

    // this says that touching makes the hero jump.  -10 is the force of the
    // jump in the y dimension (up is negative)
    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    // set up our background again, but add a few more layers
    game.backgroundColor = 0x17b4ff;

    // this layer has a scroll factor of 0... it won't move
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "back.png" }), speed: 1 });
    // this layer moves at half the speed of the hero
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "mid.png" }), speed: 0 });
    // this layer has a negative value... it moves faster than the hero
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 1, width: 16, height: 2.8, img: "front.png" }), speed: -0.5 });

    welcomeMessage("Press the hero to make it jump");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // In side-scrolling games, we can have the hero move at a fixed velocity,
  // instead of controlling its velocity with tilt or a joystick.
  else if (index == 34) {
    // default side-scroller setup.  Note that neither the hero nor the bounding box has
    // friction
    game.world.camera.setBounds(128, 9);
    Helpers.resetGravity(0, 10);
    Helpers.enableTilt(10, 0);
    Helpers.drawBoundingBox(0, 0, 128, 9, .1, { density: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0, disableRotation: true });
    // Give the hero a fixed velocity
    h.movement = new ExplicitMovement({ gravityAffectsIt: true });
    h.movement.addVelocity(10, 0);

    cfg = { cx: 124, cy: 8.25, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // center the camera a little ahead of the hero, so we can see more of the
    // world during gameplay
    game.world.camera.setCameraChase(h, 6, 0);
    // Put a button on screen that makes the hero jump. Note that we can put a
    // delay (in this case, 9000 milliseconds) to prevent rapid re-jumping.  If
    // you make it 0, you still can't jump while in the air, but you can jump as
    // soon as you land.
    Helpers.addTapControl(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, Helpers.jumpAction(h, 0, -10, 9000));
    // set up the backgrounds
    game.backgroundColor = 0x17b4ff;
    game.background.addLayer({ appearance: new ImageSprite({ cx: 0, cy: 4.5, width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // if the hero jumps over the destination, we have a problem. To fix
    // it, let's put an invisible enemy right after the destination, so
    // that if the hero misses the destination, it hits the enemy and we
    // can start over. Of course, we could just do the destination like
    // this instead, but this is more fun...
    let boxCfg = { cx: 127, cy: 4.5, width: 0.5, height: 9, img: "" };
    // Note: to debug this, you might want to temporarily move the hero to x=100
    // or so, so it doesn't take so long to get to it :)
    let end_enemy = new Actor(game.world);
    end_enemy.appearance = new ImageSprite(boxCfg);
    end_enemy.role = new Enemy();
    end_enemy.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);

    welcomeMessage("Press anywhere to jump");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // the default is that once a hero jumps, it can't jump again until it touches
  // an obstacle (floor or wall). Here, we enable multiple jumps. Coupled with a
  // small jump impulse, this makes jumping feel more like swimming or
  // controlling a helicopter.
  else if (index == 35) {
    // Note: we can go above the trees
    game.world.camera.setBounds(64, 15);
    Helpers.resetGravity(0, 10);
    Helpers.drawBoundingBox(0, 0, 64, 15, .1, { density: 1 });
    let boxCfg = { cx: 0.25, cy: 10, width: 0.75, height: 0.75, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(boxCfg);
    h.role = new Hero({ allowMultiJump: true });
    h.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { density: 1, friction: 0, disableRotation: true });
    h.movement = new ExplicitMovement();
    // You might be wondering why we can't provide the velocity as part of the
    // creation of ExplicitMovement.  It's complicated... the movement actually
    // gets attached to the rigid body, but the movement isn't connected to the
    // rigid body until the preceding line *finishes*, so the best we can do is
    // add the velocity after we make the movement.
    h.movement.addVelocity(5, 0);

    game.world.camera.setCameraChase(h, 6, 0);
    game.backgroundColor = 0x17b4ff;
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 10.5, width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // Now we'll say that the destination is as high as the screen, so reaching
    // the end means victory
    Helpers.addTapControl(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, Helpers.jumpAction(h, 0, -5, 0));
    boxCfg = { cx: 63.5, cy: 7.5, width: 0.5, height: 15, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(boxCfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);

    game.score.setVictoryDestination(1);

    // Draw some random scattered enemies.  They'll be between 10 and 60 in X,
    // and between 0 and 14 in the Y
    for (let i = 0; i < 30; ++i) {
      let cfg = { cx: 10 + Helpers.getRandom(50), cy: Helpers.getRandom(14), radius: 0.25, width: 0.5, height: 0.5, img: "red_ball.png" };
      let random_enemy = new Actor(game.world);
      random_enemy.appearance = new ImageSprite(cfg);
      random_enemy.role = new Enemy();
      random_enemy.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    }

    // This level would be more challenging if the floor was lava (a big
    // enemy)... Try changing it!

    welcomeMessage("Multi-jump is enabled");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level shows that we can make a hero move based on how we touch the
  // screen.  It also shows that we can use a set of images to animate the
  // appearance of an actor, instead of just using a single image.
  else if (index == 36) {
    game.world.camera.setBounds(48, 9);
    Helpers.drawBoundingBox(0, 0, 48, 9, .1, { density: 1, friction: 1 });
    // We do two new things here.  First, we provide animations in the hero's
    // configuration
    let h_cfg = {
      cx: .4, cy: .4, width: 0.8, height: 0.8, radius: 0.4,
      idle_right: Helpers.makeAnimation({ timePerFrame: 200, repeat: true, images: ["leg_star_1.png", "leg_star_1.png"] }),
      idle_left: Helpers.makeAnimation({ timePerFrame: 200, repeat: true, images: ["flip_leg_star_1.png", "flip_leg_star_1.png"] }),
    };
    let h = new Actor(game.world);
    // Then, here, we make an *AnimatedSprite*, which uses that configuration.
    h.appearance = new AnimatedSprite(h_cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(h_cfg, game.world, { density: 5, friction: 0.6, disableRotation: true });
    h.movement = new ExplicitMovement();
    game.world.camera.setCameraChase(h);

    let cfg = { cx: 47, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);
    game.backgroundColor = 0x17b4ff;
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // let's draw an enemy, just in case anyone wants to try to go to the bottom
    // right corner
    cfg = { cx: .5, cy: 8.5, radius: 0.5, width: 1, height: 1, img: "red_ball.png" };
    let corner_enemy = new Actor(game.world);
    corner_enemy.appearance = new ImageSprite(cfg);
    corner_enemy.role = new Enemy();
    corner_enemy.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    // draw some buttons for moving the hero.  These are "toggle" buttons: they
    // run some code when they are pressed, and other code when they are
    // released.
    Helpers.addToggleButton(game.hud, { cx: 1, cy: 4.5, width: 2, height: 5, img: "" }, () => (h.movement as ExplicitMovement).updateXVelocity(-5), () => (h.movement as ExplicitMovement).updateXVelocity(0));
    Helpers.addToggleButton(game.hud, { cx: 15, cy: 4.5, width: 2, height: 5, img: "" }, () => (h.movement as ExplicitMovement).updateXVelocity(5), () => (h.movement as ExplicitMovement).updateXVelocity(0));
    Helpers.addToggleButton(game.hud, { cx: 8, cy: 8, width: 12, height: 2, img: "" }, () => (h.movement as ExplicitMovement).updateYVelocity(5), () => (h.movement as ExplicitMovement).updateYVelocity(0));
    Helpers.addToggleButton(game.hud, { cx: 8, cy: 1, width: 12, height: 2, img: "" }, () => (h.movement as ExplicitMovement).updateYVelocity(-5), () => (h.movement as ExplicitMovement).updateYVelocity(0));
    // One thing you'll notice about these buttons is that unexpected things
    // happen if you slide your finger off of them.  Be sure to try to do things
    // like that when testing your code.  Maybe you'll decide you like the
    // unexpected behavior.  Maybe you'll decide that you need to make changes
    // to JetLag to fix the problem :)

    welcomeMessage("Press screen borders to move the hero");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // In the last level, we had complete control of the hero's movement.  Here,
  // we give the hero a fixed velocity, and only control its up/down movement.
  else if (index == 37) {
    game.world.camera.setBounds(48, 9);
    Helpers.drawBoundingBox(0, 0, 48, 9, .1, { density: 1 });
    let cfg = { cx: 47, cy: 8, radius: 0.5, width: 1, height: 1, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);
    game.backgroundColor = 0x17b4ff;
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "mid.png" }), speed: 0 });
    cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0, disableRotation: true });
    h.movement = new ExplicitMovement();
    h.movement.addVelocity(5, 0);

    game.world.camera.setCameraChase(h);

    // draw an enemy to avoid, and one at the end
    cfg = { cx: 30, cy: 6, radius: 0.5, width: 1, height: 1, img: "red_ball.png" };
    let enemy_to_avoid = new Actor(game.world);
    enemy_to_avoid.appearance = new ImageSprite(cfg);
    enemy_to_avoid.role = new Enemy();
    enemy_to_avoid.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    let boxCfg = { cx: 47.9, cy: 4.5, width: 0.1, height: 9, img: "" };
    let enemy_at_end = new Actor(game.world);
    enemy_at_end.appearance = new ImageSprite(boxCfg);
    enemy_at_end.role = new Enemy();
    enemy_at_end.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);

    // draw the up/down controls that cover the whole screen
    Helpers.addToggleButton(game.hud, { cx: 8, cy: 2.25, width: 16, height: 4.5, img: "" }, () => (h.movement as ExplicitMovement).updateYVelocity(-5), () => (h.movement as ExplicitMovement).updateYVelocity(0));
    Helpers.addToggleButton(game.hud, { cx: 8, cy: 6.75, width: 16, height: 4.5, img: "" }, () => (h.movement as ExplicitMovement).updateYVelocity(5), () => (h.movement as ExplicitMovement).updateYVelocity(0));

    welcomeMessage("Press screen borders\nto move up and down");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // this level demonstrates crawling heroes. We can use this to simulate
  // crawling, ducking, rolling, spinning, etc. Note, too, that we can use it to
  // make the hero defeat certain enemies via crawl.
  else if (index == 38) {
    game.world.camera.setBounds(48, 9);
    Helpers.resetGravity(0, 10);
    Helpers.drawBoundingBox(0, 0, 48, 9, .1, { density: 1, elasticity: 0.3 });
    let cfg = { cx: 47, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);
    let boxCfg = { cx: 0, cy: 7, width: 0.75, height: 1.5, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(boxCfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { density: 5 });
    h.movement = new ExplicitMovement();
    h.movement.addVelocity(5, 0);

    game.world.camera.setCameraChase(h);
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // to enable crawling, we just draw a crawl button on the screen
    // Be sure to hover over "crawlOn" and "crawlOff" to see what they do
    Helpers.addToggleButton(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, () => (h.role as Hero).crawlOn(Math.PI / 2), () => (h.role as Hero).crawlOff(Math.PI / 2));

    // make an enemy who we can only defeat by colliding with it while crawling
    cfg = { cx: 40, cy: 8, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    e.role = new Enemy({ defeatByCrawl: true });

    welcomeMessage("Press the screen\nto crawl");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // We can make a hero start moving only when it is pressed. This can even let
  // the hero hover until it is pressed. We could also use this to have a game
  // where the player puts obstacles in place, then starts the hero moving.
  else if (index == 39) {
    Helpers.resetGravity(0, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1 });
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "mid.png" }), speed: 0 });
    let cfg = { cx: 15, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // make a hero who doesn't start moving until it is touched
    let boxCfg = { cx: 0, cy: 8.25, width: 0.75, height: 0.75, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(boxCfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { density: 1, friction: 0, disableRotation: true });
    h.movement = new ExplicitMovement();
    game.world.camera.setCameraChase(h);

    Helpers.setTouchAndGo(h, 5, 0);

    welcomeMessage("Press the hero to start moving");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // In a side-scrolling game, it is useful to be able to change the hero's
  // speed either permanently or temporarily. In JetLag, we can use a collision
  // between a hero and an obstacle to achieve this effect.
  else if (index == 40) {
    game.world.camera.setBounds(160, 9);
    Helpers.drawBoundingBox(0, 0, 160, 9, .1, { density: 1, friction: 1 });
    let cfg = { cx: 0, cy: 0, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6, disableRotation: true });
    h.movement = new ExplicitMovement();
    h.movement.addVelocity(5, 0);

    game.world.camera.setCameraChase(h);
    cfg = { cx: 159, cy: .5, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);
    game.backgroundColor = 0x17b4ff;
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // place a speed-up obstacle that lasts for 2 seconds
    cfg = { cx: 20, cy: .5, width: 1, height: 1, radius: 0.5, img: "right_arrow.png" };
    let brief_boost = new Actor(game.world);
    brief_boost.appearance = new ImageSprite(cfg);
    brief_boost.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    brief_boost.role = new Sensor(Helpers.setSpeedBoost(5, 0, 2));

    // place a slow-down obstacle that lasts for 3 seconds
    cfg = { cx: 60, cy: .5, width: 1, height: 1, radius: 0.5, img: "left_arrow.png" };
    let brief_slowdown = new Actor(game.world);
    brief_slowdown.appearance = new ImageSprite(cfg);
    brief_slowdown.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    brief_slowdown.role = new Sensor(Helpers.setSpeedBoost(-2, 0, 3));

    // place a permanent +3 speedup obstacle... the -1 means "forever"
    cfg = { cx: 80, cy: .5, width: 1, height: 1, radius: 0.5, img: "purple_ball.png" };
    let permanent_speedup = new Actor(game.world);
    permanent_speedup.appearance = new ImageSprite(cfg);
    permanent_speedup.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    permanent_speedup.role = new Sensor(Helpers.setSpeedBoost(3, 0));

    // This isn't a very fun level, since there's no way to change the hero's
    // behavior...

    welcomeMessage("Speed boosters and reducers");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // this level only exists to show that backgrounds can scroll vertically.
  else if (index == 41) {
    // set up a level where tilt only makes the hero move up and down
    game.world.camera.setBounds(16, 36);
    Helpers.enableTilt(0, 10);
    Helpers.drawBoundingBox(0, 0, 16, 36, .1, { density: 1, friction: 1 });
    let cfg = { cx: 2, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    game.world.camera.setCameraChase(h);

    // Win by reaching the bottom
    let boxCfg = { cx: 8, cy: 35.5, width: 16, height: 1, img: "red.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(boxCfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);

    game.score.setVictoryDestination(1);

    // set up vertical scrolling backgrounds.  I was lazy and didn't make
    // anything that looks even halfway good.
    game.backgroundColor = 0xff00ff;
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "back.png" }), speed: 1, isHorizontal: false });
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "mid.png" }), speed: 0, isHorizontal: false });
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 6.4, width: 16, height: 2.8, img: "front.png" }), speed: 0.5, isHorizontal: false });

    welcomeMessage("Vertical scroller demo");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // The next few levels demonstrate support for throwing projectiles. In this
  // level, we throw projectiles by touching the hero, and the projectile always
  // goes in the same direction
  else if (index == 42) {
    Helpers.enableTilt(10, 10);
    // Just for fun, we'll have an auto-scrolling background, to make it look
    // like we're moving all the time
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "mid.png" }), speed: -5 / 1000, isAuto: true });
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // Make a hero and an enemy that slowly moves toward the hero
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    // This enemy will slowly move toward the hero
    cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "red_ball.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.role = new Enemy();
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    e.movement = new ChaseFixed(h, 0.1, 0.1, false, false);

    game.score.setVictoryEnemyCount(1);

    // configure a pool of projectiles. We say that there can be no more than 3
    // projectiles in flight at any time.  Once a projectile hits a wall or
    // enemy, it stops being "in flight", so we can throw another.
    game.world.projectiles = new ProjectileSystem(game.world, {
      maxAtOnce: 3, strength: 1, body: { radius: 0.125, cx: -100, cy: -100 },
      appearance: { cx: 0, cy: 0, width: 0.25, height: 0.25, img: "grey_ball.png", z: 1 }
    });

    // Touching the hero will throw a projectile
    h.gestures = {
      tap: () => {
        // We need to say where to start the projectile, because we may want it
        // to look like it's coming out of a certain part of the hero
        // (especially if it's animated). .525 is the sum of the radii, so the
        // projectile won't overlap the hero at all. The speed will be (10,0)
        game.world.projectiles!.throwFixed(h, .525, 0, 10, 0);
        return true;
      }
    };

    welcomeMessage("Press the hero to make it throw projectiles");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This is another demo of how throwing projectiles works. In this level, we
  // limit the distance that projectiles travel, and we can put a control on the
  // HUD for throwing projectiles in two directions
  else if (index == 43) {
    // Set up a scrolling background for the level
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "front.png" }), speed: -5 / 1000, isHorizontal: false, isAuto: true });
    Helpers.enableTilt(1, 1, true);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 8, cy: 4.5, width: 1, height: 1, radius: 0.5, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6, disableRotation: true });
    h.movement = new TiltMovement();

    // Win by defeating all enemies
    game.score.setVictoryEnemyCount();

    // draw two enemies, on either side of the screen
    let boxCfg = { cx: .25, cy: 4.5, width: 0.5, height: 9, img: "red_ball.png" };
    let left_enemy = new Actor(game.world);
    left_enemy.appearance = new ImageSprite(boxCfg);
    left_enemy.role = new Enemy();
    left_enemy.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);
    left_enemy.role.damage = 10;
    boxCfg = { cx: 15.75, cy: 4.5, width: 0.5, height: 9, img: "red_ball.png" };
    let right_enemy = new Actor(game.world);
    right_enemy.appearance = new ImageSprite(boxCfg);
    right_enemy.role = new Enemy();
    right_enemy.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);
    right_enemy.role.damage = 10;

    // set up a pool of projectiles, but now once the projectiles travel more
    // than 9 meters, they disappear
    game.world.projectiles = new ProjectileSystem(game.world, {
      maxAtOnce: 100, strength: 1, range: 9,
      body: { radius: 0.125, cx: -100, cy: -100 },
      appearance: { cx: 0, cy: 0, width: 0.25, height: 0.25, img: "grey_ball.png", z: 0 },
    });

    // Add buttons for throwing to the left and right.  Each keeps throwing for
    // as long as it is held, but only throws once every 100 milliseconds.
    // Throwing to the left flies out of the top of the hero.  Throwing to the
    // right flies out of the bottom.
    Helpers.addToggleButton(game.hud, { cx: 4, cy: 4.5, width: 8, height: 9, img: "" }, Helpers.makeRepeatThrow(h, 100, 0, -.5, -30, 0), undefined);
    Helpers.addToggleButton(game.hud, { cx: 12, cy: 4.5, width: 8, height: 9, img: "" }, Helpers.makeRepeatThrow(h, 100, 0, .5, 30, 0), undefined);

    welcomeMessage("Press left and right to throw projectiles");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // this level shows how to change the amount of damage a projectile can do
  else if (index == 44) {
    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0, cy: 0, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1, friction: 0.6 });
    h.movement = new TiltMovement();

    game.score.setVictoryEnemyCount();

    // draw a few enemies.  The damage of an enemy determines how many
    // projectiles are needed to defeat it
    for (let i = 1; i <= 6; i++) {
      cfg = { cx: 2 * i, cy: 7 - i, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
      let e = new Actor(game.world);
      e.appearance = new ImageSprite(cfg);
      e.role = new Enemy();
      e.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1.0, elasticity: 0.3, friction: 0.6 });
      e.role.damage = 2 * i;
    }

    // set up our projectiles... note that now projectiles each do 2 units of
    // damage.  Note that we make our projectiles immune to collisions.  This is
    // important if we don't want them colliding with the hero.
    game.world.projectiles = new ProjectileSystem(game.world, {
      maxAtOnce: 3, strength: 2, immuneToCollisions: true,
      // Since there isn't a radius or verts, the body will be a box
      body: { width: .1, height: .4, cx: -100, cy: -100 },
      appearance: { cx: 0, cy: 0, width: 0.1, height: 0.4, img: "grey_ball.png", z: 0 }
    });

    // this button only throws one projectile per press...
    Helpers.addTapControl(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" },
      () => { game.world.projectiles!.throwFixed(h, 0, 0, 0, -10); return true; });

    welcomeMessage("Defeat all enemies to win");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level shows how to throw projectiles in a variety of directions, based
  // on touch. The velocity of the projectile will depend on the distance
  // between the hero and the touch point
  else if (index == 45) {
    Helpers.resetGravity(0, 3);

    // Note: the height of the bounding box is set so that enemies can be drawn off screen
    // and then fall downward
    Helpers.drawBoundingBox(0, -2, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 8.5, cy: 0.5, width: 1, height: 1, radius: 0.5, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryEnemyCount(20);

    // Draw a button for throwing projectiles in many directions.  Again, note that if we
    // hold the button, it keeps throwing
    Helpers.addDirectionalThrowButton(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, h, 50, 0, 0);

    // Set up our pool of projectiles.  With this throwing mechanism, the farther from the
    // hero we press, the faster the projectile goes, so we multiply the velocity by .8 to
    // slow it down a bit
    game.world.projectiles = new ProjectileSystem(game.world, {
      maxAtOnce: 100, body: { radius: 0.125, cx: -100, cy: -100 },
      appearance: { cx: 0, cy: 0, width: 0.25, height: 0.25, img: "grey_ball.png", z: 0 }, strength: 2, multiplier: 0.8, range: 10, immuneToCollisions: true
    });

    // We'll set up a timer, so that enemies keep falling from the sky
    game.world.timer.addEvent(new TimedEvent(1, true, () => {
      // get a random number between 0.0 and 15.0
      let x = Helpers.getRandom(151) / 10;
      cfg = { cx: x, cy: -1, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
      let e = new Actor(game.world);
      e.appearance = new ImageSprite(cfg);
      e.role = new Enemy();
      e.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
      e.movement = new GravityMovement();
    }));

    welcomeMessage("Press anywhere to throw a ball");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // Continuing our exploration of projectiles, this level shows how projectiles
  // can be affected by gravity.  It also shows that projectiles do not have to
  // disappear when they collide with obstacles.
  else if (index == 46) {
    // In this level, there is no way to move the hero left and right, but it can jump
    Helpers.resetGravity(0, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: .4, cy: 0.4, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 1 });

    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    // draw a bucket, as three rectangles
    let boxCfg = { cx: 8.95, cy: 3.95, width: 0.1, height: 1, img: "red.png" };
    let leftBucket = new Actor(game.world);
    leftBucket.appearance = new ImageSprite(boxCfg);
    leftBucket.role = new Obstacle();
    leftBucket.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);

    boxCfg = { cx: 10.05, cy: 3.95, width: 0.1, height: 1, img: "red.png" };
    let rightBucket = new Actor(game.world);
    rightBucket.appearance = new ImageSprite(boxCfg);
    rightBucket.role = new Obstacle();
    rightBucket.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);

    boxCfg = { cx: 9.5, cy: 4.4, width: 1.2, height: 0.1, img: "red.png" };
    let bottomBucket = new Actor(game.world);
    bottomBucket.appearance = new ImageSprite(boxCfg);
    bottomBucket.role = new Obstacle();
    bottomBucket.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);

    // Place an enemy in the bucket, and require that it be defeated
    cfg = { cx: 9.5, cy: 3.9, width: 0.8, height: 0.8, radius: 0.4, img: "red_ball.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.role = new Enemy({ damage: 4 });
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    e.movement = new GravityMovement();

    game.score.setVictoryEnemyCount();

    // cover "most" of the screen with a button for throwing projectiles.  This
    // ensures that we can still tap the hero to make it jump
    Helpers.addTapControl(game.hud, { cx: 8.5, cy: 4.5, width: 15, height: 9, img: "" },
      Helpers.ThrowDirectionalAction(game.hud, h, 0, 0)
    );

    // Set up a projectile pool with 5 projectiles
    game.world.projectiles = new ProjectileSystem(
      game.world,
      {
        maxAtOnce: 5,
        body: { radius: 0.25, cx: -100, cy: -100 },
        appearance: { cx: 0, cy: 0, width: 0.5, height: 0.5, img: "grey_ball.png", z: 0 },
        strength: 1,
        multiplier: 2,
        gravityAffectsProjectiles: true,
        immuneToCollisions: false,
      });

    // We want to make it so that when the ball hits the obstacle (the
    // backboard), it doesn't disappear. The only time a projectile does not
    // disappear when hitting an obstacle is when you provide custom code to run
    // on a projectile/obstacle collision. In that case, you are responsible for
    // removing the projectile (or for not removing it).  That being the case,
    // we can set a "callback" to run custom code when the projectile and
    // obstacle collide, and then just have the custom code do nothing.
    leftBucket.role.projectileCollision = () => { };

    // we can make a CollisionCallback object, and connect it to several obstacles
    let c = () => { };
    rightBucket.role.projectileCollision = c;
    bottomBucket.role.projectileCollision = c;

    // put a hint on the screen after 15 seconds to show where to click to ensure that
    // projectiles hit the enemy
    game.world.timer.addEvent(new TimedEvent(15, false, () => {
      cfg = { cx: 2.75, cy: 2.4, width: 0.2, height: 0.2, radius: 0.1, img: "purple_ball.png" };
      let hint = new Actor(game.world);
      hint.appearance = new ImageSprite(cfg);
      hint.role = new Obstacle();
      // Make sure that when projectiles hit the obstacle, nothing happens
      hint.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { collisionsEnabled: false });
      hint.role.projectileCollision = () => { }
    }));

    welcomeMessage("Press anywhere to throw a projectile");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level introduces timers.  Timers let us run code at some point in the
  // future, or at a fixed interval.  In this case, we'll use the timer to make
  // more enemies.  We can use this to simulate bad things that spread, like
  // fire on a building.
  else if (index == 47) {
    // In this level, we can press the screen to move left and right
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 0.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new ExplicitMovement();

    Helpers.addToggleButton(game.hud,
      { cx: 1, cy: 4.5, width: 2, height: 9, img: "" },
      () => (h.movement as ExplicitMovement).updateXVelocity(-5),
      () => (h.movement as ExplicitMovement).updateXVelocity(0)
    );
    Helpers.addToggleButton(game.hud,
      { cx: 15, cy: 4.5, width: 2, height: 9, img: "" },
      () => (h.movement as ExplicitMovement).updateXVelocity(5),
      () => (h.movement as ExplicitMovement).updateXVelocity(0)
    );

    // Set up our projectiles.  One thing we add here is a sound when they
    // disappear
    game.world.projectiles = new ProjectileSystem(game.world, {
      maxAtOnce: 100,
      body: { radius: 0.25, cx: -100, cy: -100 },
      appearance: { cx: 0, cy: 0, width: 0.5, height: 0.5, img: "grey_ball.png", z: 0 },
      strength: 1,
      throwSound: "flap_flap.ogg",
      soundEffects: new SoundEffectComponent("slow_down.ogg")
    });

    // Touching will throw a projectile downward
    h.gestures = {
      tap: () => {
        game.world.projectiles!.throwFixed(h, .12, .75, 0, 10);
        return true;
      }
    };

    // draw an enemy that makes a sound when it disappears
    cfg = { cx: 8, cy: 4, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.role = new Enemy();
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    e.role.onDefeated = (_e: Actor, _a?: Actor) => game.musicLibrary.getSound("low_pitch.ogg").play();

    // This variable is used by the timer
    let counter = 1;

    // Run some code every two seconds
    game.world.timer.addEvent(new TimedEvent(2, true, () => {
      // only reproduce the enemy if it is visible, and the new enemy will be on-screen
      if (e.enabled && counter < 5) {
        // Figure out the Y position for enemies we make in this round
        let y = (e.rigidBody?.getCenter().y ?? 0) + counter;
        // make an enemy to the left and down
        let cfg = { cx: (e.rigidBody?.getCenter().x ?? 0) - counter, cy: y, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
        let left = new Actor(game.world);
        left.appearance = new ImageSprite(cfg);
        left.role = new Enemy();
        left.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
        left.role.onDefeated = (_e: Actor, _a?: Actor) => game.musicLibrary.getSound("low_pitch.ogg").play();
        // make an enemy to the right and down
        cfg = { cx: (e.rigidBody?.getCenter().x ?? 0) + counter, cy: y, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
        let right = new Actor(game.world);
        right.appearance = new ImageSprite(cfg);
        right.role = new Enemy();
        right.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
        right.role.onDefeated = (_e: Actor, _a?: Actor) => game.musicLibrary.getSound("low_pitch.ogg").play();
        counter += 1;
      }
    }));

    // win by defeating all the enemies
    game.score.setVictoryEnemyCount();

    // put a count of defeated enemies on the screen
    let t = new Actor(
      game.hud);
    t.appearance = new TextSprite({ cx: 0.1, cy: 8.5, center: false, face: "Arial", color: "#000000", size: 32, z: 2 },
      () => game.score.getEnemiesDefeated() + " Enemies Defeated");

    welcomeMessage("Throw balls at the enemies before they reproduce");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level shows that we can have moveable enemies that reproduce. Be
  // careful... it is possible to make a lot of enemies really quickly
  else if (index == 48) {
    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // Make a hero who moves via tilt
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    // Make a destination
    cfg = { cx: 10, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    game.score.setVictoryDestination(1);

    // make our initial enemy
    cfg = { cx: 14, cy: 7, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.role = new Enemy();
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, elasticity: 0.3, friction: 0.6 });
    e.movement = new TiltMovement();

    // We can use this array to store all of the enemies in the level
    let enemies: Actor[] = [];
    enemies.push(e);

    // Attach the number "6" to the enemy, so that we can use it as a countdown for the
    // number of remaining duplications of this enemy.  Each enemy we make will have its own
    // counter.
    e.extra.num = 6;

    // set a timer callback on the level, to repeatedly spawn new enemies.
    // warning: "6" is going to lead to lots of enemies eventually, and there's no
    // way to defeat them in this level!
    game.world.timer.addEvent(new TimedEvent(2, true, () => {
      // We will need to keep track of all the enemies we make, and then add them to
      // our list of enemies just before this function returns
      //
      // Note: it's a bad idea to make an array on every timer call, but for this
      // demo, it's OK
      let newEnemies: Actor[] = [];

      // For each enemy we've made, if it has remaining reproductions, then make
      // another enemy
      for (let e of enemies) {
        // If this enemy has remaining reproductions
        if (e.extra.num > 0) {
          // decrease remaining reproductions
          e.extra.num -= 1;

          // reproduce the enemy
          let cfg = {
            cx: (e.rigidBody?.getCenter().x ?? 0) + 0.01,
            cy: (e.rigidBody?.getCenter().y ?? 0) + 0.01,
            width: .5,
            height: .5,
            radius: .25,
            img: "red_ball.png",
          };
          let e2 = new Actor(game.world);
          e2.appearance = new ImageSprite(cfg);
          e2.role = new Enemy();
          e2.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, elasticity: 0.3, friction: 0.6 });
          e2.movement = new TiltMovement();
          // e2.rigidBody?.setVelocity(e.rigidBody!.getVelocity())

          // set the new enemy's reproductions, save it
          e2.extra.num = e.extra.num;
          newEnemies.push(e2);
        }
      }
      // Add the new enemies to the main list
      let tmp = enemies.concat(newEnemies);
      enemies = tmp;
    }));

    welcomeMessage("These enemies are really tricky");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // this level shows simple animation. Every entity can have a default
  // animation.
  else if (index == 49) {
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);
    // this hero will be animated:
    let h_cfg = {
      cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4,
      // This says that we spend 200 milliseconds on each of the images that are
      // listed, and then we repeat
      //
      // Note that "idle_right" is the default animation, and the only one that
      // is required.  it is both the default, and what to use for an Actor who
      // is facing to the right and standing still.
      idle_right: Helpers.makeAnimation({ timePerFrame: 200, repeat: true, images: ["leg_star_1.png", "leg_star_2.png", "leg_star_3.png", "leg_star_4.png"] }),
    };

    let h = new Actor(game.world);
    h.appearance = new AnimatedSprite(h_cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(h_cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new ExplicitMovement();

    Helpers.addJoystickControl(game.hud, { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5, stopOnUp: true });

    welcomeMessage("The hero is animated");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level introduces jumping animations and disappearance animations.  It
  // also shows an odd way of moving the world.  There's friction on the floor,
  // so the hero can only move by tilting while the hero is in the air
  else if (index == 50) {
    // In this level, we will have tilt to move left/right, but there is so much
    // friction that tilt will only be effective when the hero is in the air
    Helpers.resetGravity(0, 10);
    Helpers.enableTilt(10, 0);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });

    game.backgroundColor = 0x17b4ff;
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // The hero must reach this destination
    let cfg = { cx: 15, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // The hero has one animation when it is not in the air, another when it is
    // Note that "jump_right" will also be used when jumping to the left, if
    // there is no "jump_left"
    let h_cfg = {
      cx: 0.25, cy: 7, width: 0.8, height: 0.8, radius: 0.4,
      // img: "leg_star_1.png",
      // this is the more complex form of animation... we show the
      // different cells for different lengths of time
      idle_right: new AnimationSequence(true)
        .to("leg_star_1.png", 150)
        .to("leg_star_2.png", 200)
        .to("leg_star_3.png", 300)
        .to("leg_star_4.png", 350),
      // we can use the complex form to express the simpler animation, of course
      jump_right: new AnimationSequence(true)
        .to("leg_star_4.png", 200)
        .to("leg_star_6.png", 200)
        .to("leg_star_7.png", 200)
        .to("leg_star_8.png", 200),
    };
    let h = new Actor(game.world);
    h.appearance = new AnimatedSprite(h_cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(h_cfg, game.world, { density: 5, friction: 0.6, disableRotation: true });
    h.movement = new TiltMovement();
    h.gestures = { tap: () => { (h.role as Hero).jump(0, -5); return true; } }

    // create a goodie that has a disappearance animation. When the
    // goodie is ready to disappear, we'll remove it, and then we'll run
    // the disappear animation. That means that we can make it have any
    // size we want, but we need to offset it from the (defunct)
    // goodie's position. Note, too, that the final cell is blank, so
    // that we don't leave a residue on the screen.
    let g_cfg = {
      cx: 2, cy: 7.5, width: 0.5, height: 0.5, radius: 0.25,
      // We can't do a disappearance animation without also having idle_right,
      // but we can cheat and just use one image the whole time.
      idle_right: Helpers.makeAnimation({ timePerFrame: 1000, repeat: true, images: ["star_burst_3.png"] }),
      disappear: new AnimationSequence(false)
        .to("star_burst_3.png", 200)
        .to("star_burst_2.png", 200)
        .to("star_burst_1.png", 200)
        .to("star_burst_4.png", 200),
      disappearOffset: new b2Vec2(0, 0),
      disappearDims: new b2Vec2(0.5, 0.5),
    };
    let g = new Actor(game.world);
    g.appearance = new AnimatedSprite(g_cfg);
    g.role = new Goodie();
    g.rigidBody = RigidBodyComponent.Circle(g_cfg, game.world);

    welcomeMessage("Press the hero to make it jump");
    winMessage("Great Job");
  }

  // this level shows that projectiles can be animated, and that we can
  // animate the hero while it throws a projectile
  else if (index == 51) {
    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // set up our hero
    let h_cfg = {
      cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4,
      idle_right: Helpers.makeAnimation({ timePerFrame: 1000, repeat: true, images: ["color_star_1.png"] }),
      // set up an animation when the hero throws:
      throw_right: new AnimationSequence(false).to("color_star_4.png", 200).to("color_star_5.png", 400)
    };
    let h = new Actor(game.world);
    h.appearance = new AnimatedSprite(h_cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(h_cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();
    h.gestures = {
      tap: () => { game.world.projectiles!.throwFixed(h, .4, .4, 0, -3); return true; }
    };

    // make a projectile pool and give an animation pattern for the projectiles
    game.world.projectiles = new ProjectileSystem(
      game.world, {
      maxAtOnce: 100,
      body: { radius: 0.25, cx: -100, cy: -100 },
      appearance: { cx: 0, cy: 0, width: 0.5, height: 0.5, idle_right: Helpers.makeAnimation({ timePerFrame: 100, repeat: true, images: ["fly_star_1.png", "fly_star_2.png"] }), z: 0 },
      strength: 1,
      immuneToCollisions: true
    });
    welcomeMessage("Press the hero to make it throw a ball");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level explores invincibility animation. While we're at it, we
  // make some enemies that aren't affected by invincibility, and some
  // that can even damage the hero while it is invincible.
  else if (index == 52) {
    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 15, cy: 1, width: 0.5, height: 0.5, radius: 0.25, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // make an animated hero, and give it an invincibility animation
    let h_cfg = {
      cx: 0.25,
      cy: 5.25,
      width: 0.8,
      height: 0.8,
      radius: 0.4,
      img: "color_star_1.png",
      idle_right: new AnimationSequence(true)
        .to("color_star_1.png", 300)
        .to("color_star_2.png", 300)
        .to("color_star_3.png", 300)
        .to("color_star_4.png", 300),
      invincible_right: new AnimationSequence(true)
        .to("color_star_5.png", 100)
        .to("color_star_6.png", 100)
        .to("color_star_7.png", 100)
        .to("color_star_8.png", 100),
    };
    let h = new Actor(game.world);
    h.appearance = new AnimatedSprite(h_cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(h_cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    // make some enemies
    for (let i = 0; i < 5; ++i) {
      cfg = { cx: 2 * i + 1, cy: 7, width: 0.8, height: 0.8, radius: 0.4, img: "red_ball.png" };
      let e = new Actor(game.world);
      e.appearance = new ImageSprite(cfg);
      e.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1.0, elasticity: 0.3, friction: 0.6, rotationSpeed: 1 });

      // The first enemy we create will harm the hero even if the hero is
      // invincible
      if (i == 0)
        e.role = new Enemy({ damage: 4, instantDefeat: true });
      // the second enemy will not be harmed by invincibility, but won't harm an
      // invincible hero
      else if (i == 1)
        e.role = new Enemy({ damage: 4, immuneToInvincibility: true });
      // The other enemies can be defeated by invincibility
      else
        e.role = new Enemy({ disableHeroCollision: true, damage: 4, onDefeated: () => game.musicLibrary.getSound("high_pitch.ogg").play() });
    }
    // neat trick: this enemy does zero damage, but is still annoying because it
    // slows the hero down.
    cfg = { cx: 12, cy: 7, width: 0.8, height: 0.8, radius: 0.4, img: "red_ball.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.role = new Enemy({ damage: 0 });
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 10, elasticity: 0.3, friction: 0.6 });
    e.movement = new TiltMovement();

    // add a goodie that makes the hero invincible
    cfg = { cx: 15, cy: 7, width: 0.5, height: 0.5, radius: 0.25, img: "blue_ball.png" };
    let g = new Actor(game.world);
    g.appearance = new ImageSprite(cfg);
    g.role = new Goodie({
      onCollect: (_g: Actor, h: Actor) => {
        (h.role as Hero).invincibleRemaining = (h.role as Hero).invincibleRemaining + 15;
        return true;
      }
    });
    g.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { rotationSpeed: .25 });
    g.movement = new PathMovement(new Path().to(15, 7).to(5, 2).to(15, 7), 1, true);

    let t = new Actor(
      game.hud);
    t.appearance = new TextSprite({ cx: 0.1, cy: 8.5, center: false, face: "Arial", color: "#3C46FF", size: 12, z: 2 },
      () => game.score.goodieCount[0] + " Goodies");

    // draw a picture when the level is won, and don't print text...
    // this particular picture isn't very useful
    game.score.winSceneBuilder = (overlay: Scene) => {
      Helpers.addTapControl(
        overlay,
        { cx: 8, cy: 4.5, width: 16, height: 9, img: "fade.png" },
        () => { game.switchTo(game.config.levelBuilder, 53); return true; }
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
  else if (index == 53) {
    Helpers.resetGravity(0, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3 });

    let cfg = { cx: 15, cy: 8.5, width: 0.5, height: 0.5, radius: 0.25, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // make a hero with fixed velocity, and give it crawl and jump
    // animations
    let boxCfg = {
      cx: 0, cy: 8, width: 0.75, height: 0.75,
      idle_right: Helpers.makeAnimation({ timePerFrame: 100, repeat: true, images: ["leg_star_1.png"] }),
      jump_right: new AnimationSequence(true)
        .to("leg_star_5.png", 200)
        .to("leg_star_6.png", 200)
        .to("leg_star_7.png", 200)
        .to("leg_star_8.png", 200),
      crawl_right: new AnimationSequence(true)
        .to("leg_star_1.png", 100)
        .to("leg_star_2.png", 300)
        .to("leg_star_3.png", 300)
        .to("leg_star_4.png", 100)

    };
    let h = new Actor(game.world);
    h.appearance = new AnimatedSprite(boxCfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { density: 5 });
    h.movement = new ExplicitMovement();
    h.movement.addVelocity(2, 0);

    game.world.camera.setCameraChase(h);

    // enable hero jumping and crawling
    Helpers.addTapControl(game.hud, { cx: 4, cy: 4.5, width: 8, height: 9, img: "" }, Helpers.jumpAction(h, 0, -8, 0));
    Helpers.addToggleButton(game.hud,
      { cx: 12, cy: 4.5, width: 8, height: 9, img: "" },
      () => (h.role as Hero).crawlOn(Math.PI / 2),
      () => (h.role as Hero).crawlOff(Math.PI / 2)
    );

    // add an enemy we can defeat via crawling. It should be defeated even by a
    // "jump crawl"
    let eBoxCfg = { cx: 13, cy: 6.5, width: 1, height: 5, img: "red_ball.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(eBoxCfg);
    e.role = new Enemy({ defeatByCrawl: true });
    e.rigidBody = RigidBodyComponent.Box(eBoxCfg, game.world, { density: 5, elasticity: 0.3, friction: 0.6 });

    // include a picture on the "try again" screen
    game.score.loseSceneBuilder = (overlay: Scene) => {
      Helpers.addTapControl(
        overlay,
        { cx: 8, cy: 4.5, width: 16, height: 9, img: "fade.png" },
        () => { game.switchTo(game.config.levelBuilder, 53); return true; }
      );
      let t = new Actor(
        overlay);
      t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 },
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
  else if (index == 54) {
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // create 7 goodies, each of which adds 1 to the hero's strength
    for (let i = 0; i < 7; ++i) {
      let cfg = { cx: 1 + i, cy: 1 + i, width: 0.5, height: 0.5, radius: 0.25, img: "blue_ball.png" };
      let g = new Actor(game.world);
      g.appearance = new ImageSprite(cfg);
      g.role = new Goodie({
        onCollect: (_g: Actor, h: Actor) => {
          (h.role as Hero).strength = 1 + (h.role as Hero).strength;
          return true;
        }
      });
      g.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    }

    let cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // make 8 enemies, each with strength == 1, so we can test moving our strength all the
    // way up to 8 and back down again
    for (let i = 0; i < 8; ++i) {
      cfg = { cx: 2 + i, cy: 1 + i, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
      let e = new Actor(game.world);
      e.appearance = new ImageSprite(cfg);
      e.role = new Enemy({ damage: 1, disableHeroCollision: true });
      e.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    }

    cfg = { cx: 0, cy: 0, width: 0.8, height: 0.8, radius: 0.4, img: "color_star_1.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    // provide some code to run when the hero's strength changes
    h.role = new Hero({
      strengthChangeCallback: (actor: Actor) => {
        // get the hero's strength. Since the hero isn't dead, the
        // strength is at least 1. Since there are 7 strength
        // booster goodies, the strength is at most 8.
        let s = (actor.role as Hero).strength;
        // set the hero's image according to the strength
        (actor.appearance as ImageSprite).setImage("color_star_" + s + ".png");
      }
    });
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new ExplicitMovement();

    Helpers.addJoystickControl(game.hud, { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5, stopOnUp: true });
  }

  // We can use obstacles to defeat enemies, and we can control which enemies
  // the obstacle can defeat, by using obstacle-enemy collision callbacks
  else if (index == 55) {
    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });

    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    // make four enemies
    cfg = { cx: 10, cy: 2, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
    let small_enemy_1 = new Actor(game.world);
    small_enemy_1.appearance = new ImageSprite(cfg);
    small_enemy_1.role = new Enemy();
    small_enemy_1.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    cfg = { cx: 10, cy: 4, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
    let small_enemy_2 = new Actor(game.world);
    small_enemy_2.appearance = new ImageSprite(cfg);
    small_enemy_2.role = new Enemy();
    small_enemy_2.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    cfg = { cx: 10, cy: 6, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
    let small_enemy_3 = new Actor(game.world);
    small_enemy_3.appearance = new ImageSprite(cfg);
    small_enemy_3.role = new Enemy();
    small_enemy_3.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    cfg = { cx: 10, cy: 8, radius: 1, width: 2, height: 2, img: "red_ball.png" };
    let big_enemy = new Actor(game.world);
    big_enemy.appearance = new ImageSprite(cfg);
    big_enemy.role = new Enemy();
    big_enemy.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    // We can use "extra" to put some more information onto any actor
    big_enemy.extra.size = "big";

    // win by defeating enemies
    game.score.setVictoryEnemyCount(4);

    // put an enemy defeated count on the screen, in red with a small font
    let t = new Actor(
      game.hud);
    t.appearance = new TextSprite({ cx: 0.5, cy: 8, center: false, face: "Arial", color: "#FF0000", size: 10, z: 2 },
      () => game.score.getEnemiesDefeated() + "/4 Enemies Defeated");

    // make a moveable obstacle.  We're going to enable it to defeat the "big"
    // enemy
    cfg = { cx: 14, cy: 2, width: 1, height: 1, radius: 0.5, img: "blue_ball.png" };
    let big_obstacle = new Actor(game.world);
    big_obstacle.appearance = new ImageSprite(cfg);
    // when this obstacle collides with any enemy, it checks the enemy's
    // "extra".  If it matches "big", then this obstacle defeats the enemy, and
    // the obstacle disappears.
    big_obstacle.role = new Obstacle({
      enemyCollision: (thisActor: Actor, collideActor: Actor) => {
        if (collideActor.extra.size === "big") {
          (collideActor.role as Enemy).defeat(true, thisActor);
          thisActor.remove(true);
        }
      }
    });
    big_obstacle.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    big_obstacle.movement = new TiltMovement();

    // make a small obstacle that can defeat the enemies that aren't "big"
    cfg = { cx: 0.5, cy: 0.5, width: 0.5, height: 0.5, radius: 0.25, img: "blue_ball.png" };
    let small_obstacle = new Actor(game.world);
    small_obstacle.appearance = new ImageSprite(cfg);
    small_obstacle.role = new Obstacle({
      enemyCollision: (_thisActor: Actor, collideActor: Actor) => {
        if (collideActor.extra.size !== "big") {
          (collideActor.role as Enemy).defeat(true, undefined);
        }
      }
    });
    small_obstacle.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    small_obstacle.movement = new TiltMovement();

    welcomeMessage("Obstacles can defeat enemies!");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // This level shows that we can make entities that shrink or grow over time.
  else if (index == 56) {
    // Negative gravity... the hero is going to float upward!
    Helpers.resetGravity(0, -10);
    Helpers.enableTilt(10, 0);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // Make a hero who is blocked from moving upward by a shrinking ceiling
    let cfg = { cx: 2, cy: 2, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    let boxCfg = { cx: 1, cy: 1, width: 8, height: 1, img: "red.png" };
    let ceiling = new Actor(game.world);
    ceiling.appearance = new ImageSprite(boxCfg);
    ceiling.role = new Obstacle();
    ceiling.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);

    Helpers.setShrinkOverTime(ceiling, 0.1, 0.1, true);

    // make an obstacle that causes the hero to throw Projectiles when touched
    //
    // It might seem silly to use an obstacle instead of something on the HUD,
    // but it's good to realize that all these different behaviors are really
    // the same.
    cfg = { cx: 15, cy: 2, width: 1, height: 1, radius: 0.5, img: "purple_ball.png" };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(cfg);
    o.role = new Obstacle();
    o.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { collisionsEnabled: false });
    o.gestures = {
      tap: () => {
        game.world.projectiles!.throwFixed(h, .125, .75, 0, 15);
        return true;
      }
    }

    // set up our projectiles.  There are only 20... throw them carefully
    game.world.projectiles = new ProjectileSystem(game.world, {
      maxAtOnce: 3, strength: 2,
      body: { radius: 0.25, cx: -100, cy: -100 },
      appearance: { img: "color_star_1.png", cx: 0, cy: 0, width: 0.5, height: 0.5, z: 0 },
      randomImageSources: ["color_star_1.png", "color_star_2.png", "color_star_3.png", "color_star_4.png"]
    });
    game.world.projectiles.setNumberOfProjectiles(20);

    // show how many shots are left
    let t = new Actor(
      game.hud);
    t.appearance = new TextSprite({ cx: 0.5, cy: 8.5, center: false, face: "Arial", color: "#FF00FF", size: 12, z: 2 },
      () => game.world.projectiles?.getRemaining() + " projectiles left");

    // draw a bunch of enemies to defeat
    cfg = { cx: 4, cy: 5, width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png" };
    let spin_enemy = new Actor(game.world);
    spin_enemy.appearance = new ImageSprite(cfg);
    spin_enemy.role = new Enemy();
    spin_enemy.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1.0, elasticity: 0.3, friction: 0.6, rotationSpeed: 1 });

    for (let i = 1; i < 20; i += 5) {
      cfg = { cx: 1 + i / 2, cy: 7, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
      let e = new Actor(game.world);
      e.appearance = new ImageSprite(cfg);
      e.role = new Enemy();
      e.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    }

    // draw a few obstacles that shrink over time, to show that circles and
    // boxes work, we can shrink the X and Y rates independently, and we can opt
    // to center things as they shrink or grow
    boxCfg = { cx: 2, cy: 8, width: 1, height: 1, img: "red.png" };
    let grow_box = new Actor(game.world);
    grow_box.appearance = new ImageSprite(boxCfg);
    grow_box.role = new Obstacle();
    grow_box.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);
    Helpers.setShrinkOverTime(grow_box, -1, 0, false);

    cfg = { cx: 3, cy: 7, width: 1, height: 1, radius: 0.5, img: "purple_ball.png" };
    let small_shrink_ball = new Actor(game.world);
    small_shrink_ball.appearance = new ImageSprite(cfg);
    small_shrink_ball.role = new Obstacle();
    small_shrink_ball.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    Helpers.setShrinkOverTime(small_shrink_ball, 0.1, 0.2, true);

    cfg = { cx: 11, cy: 6, radius: 1, width: 2, height: 2, img: "purple_ball.png" };
    let big_shrink_ball = new Actor(game.world);
    big_shrink_ball.appearance = new ImageSprite(cfg);
    big_shrink_ball.role = new Obstacle();
    big_shrink_ball.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    Helpers.setShrinkOverTime(big_shrink_ball, 0.2, 0.1, false);

    game.score.setVictoryEnemyCount(5);

    // This level makes an interesting point... what do you do if you run out of
    // projectiles?  How can we say "start over"?  There are a few ways that
    // would work... what can you come up with?

    welcomeMessage("Actors can shrink and grow\n\n" + "(Be sure to disable debug boxes in GameConfig.java)");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // this level shows that we can make a hero in the air rotate. Rotation
  // doesn't do anything, but it looks nice...
  else if (index == 57) {
    Helpers.resetGravity(0, 10);
    Helpers.enableTilt(10, 0);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    welcomeMessage("Press to rotate the hero");
    winMessage("Great Job");
    loseMessage("Try Again");

    let cfg = { cx: 15, cy: 4, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // make the hero jump on tap, so that we can see it spin in the air
    cfg = { cx: 4, cy: 8, width: 0.5, height: 0.5, radius: 0.25, img: "leg_star_1.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1, friction: 0.6 });
    h.movement = new TiltMovement();

    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    // add buttons for rotating the hero
    Helpers.addToggleButton(game.hud,
      { cx: 4, cy: 4.5, width: 8, height: 9, img: "" },
      () => (h.role as Hero).increaseRotation(-0.05),
      () => (h.role as Hero).increaseRotation(-0.05)
    );
    Helpers.addToggleButton(game.hud,
      { cx: 12, cy: 4.5, width: 8, height: 9, img: "" },
      () => (h.role as Hero).increaseRotation(0.05),
      () => (h.role as Hero).increaseRotation(0.05)
    );
  }

  // we can attach movement buttons to any moveable entity, so in this case, we
  // attach it to an obstacle to get an Arkanoid-like effect.
  else if (index == 58) {
    Helpers.drawBoundingBox(0, 0, 16, 9, .1);

    let cfg = { cx: 14, cy: 1, radius: 0.125, width: 0.25, height: 0.25, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // make a hero who is always moving... note there is no friction,
    // anywhere, and the hero is elastic... it won't ever stop...
    cfg = { cx: 4, cy: 4, width: 0.5, height: 0.5, radius: 0.25, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { elasticity: 1, friction: 0.1 });
    h.movement = new ExplicitMovement();
    h.movement.addVelocity(0, 10);

    // make an obstacle and then connect it to some controls
    let boxCfg = { cx: 2, cy: 8.75, width: 1, height: 0.5, img: "red.png" };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(boxCfg);
    o.role = new Obstacle();
    o.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { density: 100, elasticity: 1, friction: 0.1 });
    o.movement = new ExplicitMovement();

    Helpers.addToggleButton(
      game.hud,
      { cx: 4, cy: 4.5, width: 8, height: 9, img: "" },
      () => (o.movement as ExplicitMovement).updateXVelocity(-5),
      () => (o.movement as ExplicitMovement).updateXVelocity(0)
    );
    Helpers.addToggleButton(
      game.hud,
      { cx: 12, cy: 4.5, width: 8, height: 9, img: "" },
      () => (o.movement as ExplicitMovement).updateXVelocity(5),
      () => (o.movement as ExplicitMovement).updateXVelocity(0)
    );
  }

  // In this level, we'll use some timers that happen after certain amounts of
  // time elapse.
  else if (index == 59) {
    Helpers.enableTilt(10, 10);
    welcomeMessage("Things will appear  and disappear...");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // create an enemy that will quietly disappear after 2 seconds
    cfg = { cx: 1, cy: 1, radius: 1, width: 2, height: 2, img: "red_ball.png" };
    let disappear_enemy = new Actor(game.world);
    disappear_enemy.appearance = new ImageSprite(cfg);
    disappear_enemy.role = new Enemy();
    disappear_enemy.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1.0, elasticity: 0.3, friction: 0.6, rotationSpeed: 1 });
    game.world.timer.addEvent(new TimedEvent(2, false, () => disappear_enemy.remove(true)));

    // create an enemy that will appear after 3 seconds
    cfg = { cx: 5, cy: 5, radius: 1, width: 2, height: 2, img: "red_ball.png" };
    let appear_enemy = new Actor(game.world);
    appear_enemy.appearance = new ImageSprite(cfg);
    appear_enemy.role = new Enemy();
    appear_enemy.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1.0, elasticity: 0.3, friction: 0.6 });
    appear_enemy.movement = new PathMovement(new Path().to(5, 5).to(10, 7).to(5, 5), 3, true);
    // Initially it's disabled, but it will appear in 3 seconds
    //
    // Note that we could have just made a timed event to make the enemy, but
    // this is a nice technique, too.
    appear_enemy.enabled = false;
    game.world.timer.addEvent(new TimedEvent(3, false, () => appear_enemy.enabled = true))
  }

  // This level uses timers to make more of the level appear over time
  else if (index == 60) {
    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    welcomeMessage("There's nothing to do... yet");
    winMessage("Great Job");
    loseMessage("Try Again");

    // note: there's no destination yet, but we still say it's how to
    // win... we'll get a destination in this level after a few timers
    // run...
    game.score.setVictoryDestination(1);

    // set a timer callback. after three seconds, the callback will run
    game.world.timer.addEvent(new TimedEvent(2, false, () => {
      game.installOverlay((overlay: Scene) => {
        let t = new Actor(overlay);
        t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#000000", size: 18, z: 0 },
          () => "Ooh... a draggable enemy");
        Helpers.addTapControl(overlay,
          { cx: 8, cy: 4.5, width: 16, height: 9, img: "" },
          () => { game.clearOverlay(); return true; }
        );
        // make a draggable enemy
        // don't forget drag zone
        cfg = { cx: 8, cy: 7, radius: 1, width: 2, height: 2, img: "red_ball.png" };
        let draggable = new Actor(game.world);
        draggable.appearance = new ImageSprite(cfg);
        draggable.role = new Enemy();
        draggable.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1.0, elasticity: 0.3, friction: 0.6 });
        draggable.movement = new Draggable(true);
        Helpers.createDragZone(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" });
      });
    }));

    // set another callback that runs after 6 seconds (note: time
    // doesn't count while the PauseScene is showing...)
    game.world.timer.addEvent(new TimedEvent(6, false, () => {
      // You will probably notice a weird "glitch", where you can see the new
      // actors flash for a moment before the message appears.  To fix that,
      // consider drawing the actors as part of the code that runs when the
      // overlay is tapped.
      game.installOverlay((overlay: Scene) => {
        let t = new Actor(overlay);
        t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#00FF00", size: 18, z: 1 },
          () => "Touch the enemy and it will go away");
        Helpers.addTapControl(overlay,
          { cx: 8, cy: 4.5, width: 16, height: 9, img: "black.png", z: -1 },
          () => { game.clearOverlay(); return true; }
        );
        // add an enemy that is touch-to-defeat
        cfg = { cx: 9, cy: 5, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
        let touch_enemy = new Actor(game.world);
        touch_enemy.appearance = new ImageSprite(cfg);
        touch_enemy.role = new Enemy();
        touch_enemy.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1.0, elasticity: 0.3, friction: 0.6 });

        Helpers.defeatOnTouch(touch_enemy.role as Enemy);
      });
    }));

    // set a callback that runs after 9 seconds.
    game.world.timer.addEvent(new TimedEvent(9, false, () => {
      // draw an enemy, a goodie, and a destination, all with
      // fixed velocities
      game.installOverlay((overlay: Scene) => {
        Helpers.addTapControl(overlay,
          { cx: 8, cy: 4.5, width: 16, height: 9, img: "black.png", z: -1 },
          () => { game.clearOverlay(); return true; }
        );
        let t = new Actor(overlay);
        t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#FFFFFF", size: 18, z: 1 },
          () => "Now you can see the rest of the level");
        cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
        let d = new Actor(game.world);
        d.appearance = new ImageSprite(cfg);
        d.role = new Destination();
        d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

        cfg = { cx: 3, cy: 3, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
        let final_enemy = new Actor(game.world);
        final_enemy.appearance = new ImageSprite(cfg);
        final_enemy.role = new Enemy();
        final_enemy.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1.0, elasticity: 0.3, friction: 0.6 });

        cfg = { cx: 10, cy: 1, radius: 1, width: 2, height: 2, img: "blue_ball.png" };
        let g = new Actor(game.world);
        g.appearance = new ImageSprite(cfg);
        g.role = new Goodie();
        g.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
      });
    }));

    // Lastly, we can make a timer callback that runs over and over
    // again. This one starts after 2 seconds
    let spawnLoc = 0;
    game.world.timer.addEvent(new TimedEvent(2, true, () => {
      let cfg = { cx: spawnLoc % 16 + .5, cy: Math.floor(spawnLoc / 16) + .5, width: 1, height: 1, radius: 0.5, img: "purple_ball.png" };
      let repeat_timer_obstacle = new Actor(game.world);
      repeat_timer_obstacle.appearance = new ImageSprite(cfg);
      repeat_timer_obstacle.role = new Obstacle();
      repeat_timer_obstacle.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
      spawnLoc++;
    }));
    // It's important to test your levels carefully.  In this level, the
    // obstacles can overlap with the hero, and then the hero can get stuck.
  }

  // This level shows callbacks that run on a collision between hero and
  // obstacle. In this case, it lets us draw out the next part of the level
  // later, instead of drawing the whole thing right now. In a real level, we'd
  // draw a few screens at a time, and not put the callback obstacle at the end
  // of a screen, so that we'd never see the drawing of stuff taking place, but
  // for this demo, that's actually a nice effect.
  else if (index == 61) {
    Helpers.enableTilt(10, 10);
    welcomeMessage("Keep going right!");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 64, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    game.world.camera.setBounds(64, 9);

    let cfg = { cx: 2, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    game.world.camera.setCameraChase(h);
    let t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 0.1, cy: 8.5, center: false, face: "Arial", color: "#3C46FF", size: 12, z: 2 }, () => game.score.goodieCount[0] + " Goodies");
    game.score.setVictoryDestination(1);

    // this obstacle is a collision callback... when the hero hits it, we'll run
    // a script to build the next part of the level.
    let boxCfg = { cx: 14, cy: 4.5, width: 1, height: 9, img: "purple_ball.png" };
    let callback_obstacle = new Actor(game.world);
    callback_obstacle.appearance = new ImageSprite(boxCfg);
    callback_obstacle.role = new Obstacle({ disableHeroCollision: true });
    callback_obstacle.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { density: 1, friction: 1 });
    callback_obstacle.movement = new ExplicitMovement();

    // Let's count how many goodies we collect
    let collects = 0;
    // Here's a script for making goodies
    let makeGoodie = function (x: number) {
      cfg = { cx: x, cy: 8, width: 1, height: 1, radius: 0.5, img: "blue_ball.png" };
      let g = new Actor(game.world);
      g.appearance = new ImageSprite(cfg);
      g.role = new Goodie({
        onCollect: () => {
          collects++;
          callback_obstacle.role?.disableHeroCollision();
          return true;
        }
      });
      g.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    }
    // And now we can make the script to run when the hero collides with the
    // obstacle
    let script = function () {
      // If the obstacle is still at its starting point, we move it and add a
      // goodie
      if (callback_obstacle.rigidBody?.getCenter().x == 14) {
        callback_obstacle.rigidBody.setCenter(30, 4.5);
        makeGoodie(18);
        callback_obstacle.role?.enableHeroCollision();
        // Notice that we can explicitly play a sound like this:
        game.musicLibrary.getSound("high_pitch.ogg").play();
        return;
      }

      // If the obstacle is at 30, we need a goodie to have been collected
      if (callback_obstacle.rigidBody?.getCenter().x == 30) {
        if (collects != 1) return;
        callback_obstacle.rigidBody.setCenter(50, 4.5);
        makeGoodie(46);
        callback_obstacle.role?.enableHeroCollision();
        game.musicLibrary.getSound("high_pitch.ogg").play();
        return;
      }

      // if the obstacle is at 50, we need two goodies
      else if (callback_obstacle.rigidBody?.getCenter().x == 50) {
        if (collects != 2) return;
        callback_obstacle.rigidBody.setCenter(60, 4.5);
        makeGoodie(56);
        callback_obstacle.role?.enableHeroCollision();
        game.musicLibrary.getSound("high_pitch.ogg").play();
        return;
      }

      // if the obstacle is at 60 and we have 3 goodies, remove the obstacle,
      // pause the game, draw the destination.
      else if (callback_obstacle.rigidBody?.getCenter().x == 60) {
        if (collects != 3) return;
        callback_obstacle.remove(true);

        game.musicLibrary.getSound("high_pitch.ogg").play();

        // print a message and pause the game, via PauseScene
        game.installOverlay((overlay: Scene) => {
          Helpers.addTapControl(overlay,
            { cx: 8, cy: 4.5, width: 16, height: 9, img: "black.png" },
            () => { game.clearOverlay(); return true; }
          );
          let t = new Actor(overlay);
          t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#FFFFFF", size: 32, z: 0 },
            () => "The destination is now available");
          cfg = { cx: 63, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
          let d = new Actor(game.world);
          d.appearance = new ImageSprite(cfg);
          d.role = new Destination();
          d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
        });
      }
    }

    // Now we can connect the script to the obstacle
    callback_obstacle.role.heroCollision = script;
  }

  // this level demonstrates callbacks that happen when we touch an obstacle.
  else if (index == 62) {
    Helpers.enableTilt(10, 10);
    welcomeMessage("Touching the obstacle won't work until\nyou collect a goodie");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    // make a destination... notice that it needs a lot more goodies
    // than are on the screen...
    cfg = { cx: 15, cy: 1, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination({ onAttemptArrival: () => { return game.score.goodieCount[0] > 3; } });
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // draw an obstacle, attach some code to it
    cfg = { cx: 10, cy: 5, width: 0.5, height: 0.5, radius: 0.25, img: "purple_ball.png" };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(cfg);
    o.role = new Obstacle();
    o.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1, friction: 1 });
    o.sounds = new SoundEffectComponent("high_pitch.ogg");
    o.gestures = {
      tap: () => {
        if (game.score.goodieCount[0] == 0) return false;
        // note: we could draw a picture of an open chest in the
        // obstacle's place, or even use a disappear animation whose
        // final frame looks like an open treasure chest.
        o.remove(false);
        // Draw a bunch of goodies!
        for (let i = 0; i < 3; ++i) {
          cfg = { cx: 3 * i + 1, cy: 7 - i, width: 0.5, height: 0.5, radius: 0.25, img: "blue_ball.png" };
          let g = new Actor(game.world);
          g.appearance = new ImageSprite(cfg);
          g.role = new Goodie();
          g.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
        }
        return true;
      }
    };

    cfg = { cx: 2, cy: 2, radius: 1, width: 2, height: 2, img: "blue_ball.png" };
    let g = new Actor(game.world);
    g.appearance = new ImageSprite(cfg);
    g.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    g.role = new Goodie({
      onCollect: (_g: Actor, _h: Actor) => {
        game.musicLibrary.getSound("low_pitch.ogg").play();
        game.score.goodieCount[0]++;
        return true;
      }
    });
  }

  // this level shows how to use enemy defeat callbacks. There are five
  // ways to defeat an enemy, so we enable all mechanisms in this level,
  // to see if they all work to cause enemy callbacks to run the
  // enemy collision callback code.
  else if (index == 63) {
    welcomeMessage("There are five ways to defeat an enemy");
    winMessage("You did it!");

    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1);

    // make a hero and give it some strength, so it can defeat an enemy via
    // collision.
    let h_cfg = {
      cx: 5, cy: 5, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png",
      idle_right: Helpers.makeAnimation({ timePerFrame: 1000, repeat: true, images: ["green_ball.png"] }),
      invincible_right: new AnimationSequence(true).to("color_star_5.png", 100).to("color_star_6.png", 100).to("color_star_7.png", 100).to("color_star_8.png", 100)
    };
    let h = new Actor(game.world);
    h.appearance = new AnimatedSprite(h_cfg);
    h.role = new Hero({ strength: 3 });
    h.rigidBody = RigidBodyComponent.Circle(h_cfg, game.world);
    h.movement = new TiltMovement();

    // Make a goodie that will turn the hero invincible, so we can test
    // invincibility
    let cfg = { cx: 10, cy: 5, width: 0.5, height: 0.5, radius: 0.25, img: "blue_ball.png" };
    let g1 = new Actor(game.world);
    g1.appearance = new ImageSprite(cfg);
    g1.role = new Goodie({ onCollect: (_g: Actor, h: Actor) => { (h.role as Hero).invincibleRemaining = 15; return true; } });
    g1.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    // Tapping the hero will throw a projectile, which is another way to defeat
    // enemies
    h.gestures = { tap: () => { game.world.projectiles!.throwFixed(h, -.75, 0, -20, 0); return true; } }
    game.world.projectiles = new ProjectileSystem(game.world, {
      maxAtOnce: 100, strength: 1,
      body: { radius: 0.1, cx: -100, cy: -100 },
      appearance: { cx: 0, cy: 0, width: 0.2, height: 0.21, img: "grey_ball.png" }
    });

    // add an obstacle that has an enemy collision callback, so it can defeat
    // enemies by colliding with them (but only the one we mark as "weak")
    cfg = { cx: 15, cy: 1, width: 1, height: 1, radius: 0.5, img: "purple_ball.png" };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(cfg);
    o.role = new Obstacle({ enemyCollision: (_thisActor: Actor, collideActor: Actor) => { if (collideActor.extra.info === "weak") (collideActor.role as Enemy).defeat(true, undefined); } });
    o.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1000 });
    // We'll use flicking to move the obstacle
    o.movement = new FlickMovement(1);
    Helpers.createFlickZone(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" });

    // Here's some code to run whenever an enemy is defeated
    let onDefeatScript = () => {
      // Make a fresh pause scene
      game.installOverlay((overlay: Scene) => {
        let t = new Actor(overlay);
        t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#58E2A0", size: 16, z: 0 }, () => "good job, here's a prize");
        Helpers.addTapControl(overlay, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, () => { game.clearOverlay(); return true; });

        // Draw a goodie on the screen somewhat randomly as a reward... picking
        // in the range 0-8,0-15 ensures that with width and height of 1, the
        // goodie stays on screen
        cfg = { cx: Helpers.getRandom(15) + .5, cy: Helpers.getRandom(8) + .5, radius: 0.5, width: 1, height: 1, img: "blue_ball.png" };
        let g = new Actor(game.world);
        g.appearance = new ImageSprite(cfg);
        g.role = new Goodie();
        g.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
      });
    };

    // now draw our enemies... we need enough to be able to test that all five
    // defeat mechanisms work.
    cfg = { cx: 1, cy: 1, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    let e1 = new Actor(game.world);
    e1.appearance = new ImageSprite(cfg);
    e1.role = new Enemy({ onDefeated: onDefeatScript });
    e1.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    cfg = { cx: 1, cy: 3, width: .5, height: .5, radius: 0.25, img: "red_ball.png" };
    let e2 = new Actor(game.world);
    e2.appearance = new ImageSprite(cfg);
    e2.role = new Enemy({ onDefeated: onDefeatScript });
    e2.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    e2.extra.info = "weak";

    cfg = { cx: 1, cy: 5, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    let e3 = new Actor(game.world);
    e3.appearance = new ImageSprite(cfg);
    e3.role = new Enemy({ onDefeated: onDefeatScript });
    e3.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    cfg = { cx: 1, cy: 6.5, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    let e4 = new Actor(game.world);
    e4.appearance = new ImageSprite(cfg);
    e4.role = new Enemy({ onDefeated: onDefeatScript });
    e4.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    Helpers.defeatOnTouch(e4.role);

    cfg = { cx: 1, cy: 8, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    let e5 = new Actor(game.world);
    e5.appearance = new ImageSprite(cfg);
    e5.role = new Enemy({ onDefeated: onDefeatScript });
    e5.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    // win by defeating enemies
    game.score.setVictoryEnemyCount(5);
  }

  // This level shows that we can resize a hero on the fly, and change its
  // image. We use a collision callback to cause the effect. Furthermore, we can
  // increment scores inside of the callback code, which lets us activate the
  // destination on an obstacle collision
  else if (index == 64) {
    Helpers.enableTilt(10, 10);
    welcomeMessage("Only stars can reach the destination");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 1, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    let t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 0.1, cy: 8.5, center: false, face: "Arial", color: "#3C46FF", size: 12, z: 2 }, () => game.score.goodieCount[0] + " Goodies");

    // the destination won't work until some goodies are collected...
    cfg = { cx: 15, cy: 1, width: 1, height: 1, radius: 0.5, img: "color_star_1.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination({ onAttemptArrival: () => { return game.score.goodieCount[0] >= 4 && game.score.goodieCount[1] >= 1 && game.score.goodieCount[2] >= 3; } });
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // Colliding with this star will make the hero into a star
    let boxCfg = { cx: 15, cy: 8, width: 1, height: 1, radius: 0.5, img: "leg_star_1.png" };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(boxCfg);
    o.role = new Obstacle();
    o.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { density: 1, friction: 1 });

    o.role.heroCollision = (thisActor: Actor, collideActor: Actor) => {
      // here's a simple way to increment a goodie count
      game.score.goodieCount[1]++;
      // here's a way to set a goodie count
      game.score.goodieCount[2] = 3;
      // here's a way to read and write a goodie count
      game.score.goodieCount[0] = 4 + game.score.goodieCount[0];
      // get rid of the star, so we know it's been used
      thisActor.remove(true);
      // resize the hero, and change its image
      collideActor.resize(collideActor.rigidBody?.getCenter().x ?? 0, collideActor.rigidBody?.getCenter().y ?? 0, 0.5, 0.5);
      (collideActor.appearance as ImageSprite).setImage("leg_star_1.png");
    };
  }

  // This level shows how to use countdown timers to win a level, and introduces
  // a way to throw projectiles in an arbitrary direction but with fixed
  // velocity.
  else if (index == 65) {
    Helpers.resetGravity(0, 10);
    welcomeMessage("Press anywhere to throw a ball");
    winMessage("You Survived!");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // draw a hero, and a button for throwing projectiles in many directions.
    // Note that this is going to look like an "asteroids" game, with a hero
    // covering the bottom of the screen, so that anything that falls to the
    // bottom counts against the player
    let boxCfg = { cx: 8, cy: 8.74, width: 15.9, height: 0.5, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(boxCfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);

    Helpers.addDirectionalThrowButton(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, h, 100, 0, -0.5);

    // set up our pool of projectiles, then set them to have a fixed
    // velocity when using the vector throw mechanism
    game.world.projectiles = new ProjectileSystem(game.world, {
      maxAtOnce: 100, strength: 1, range: 20, fixedVectorVelocity: 5,
      body: { radius: 0.1, cx: -100, cy: -100 },
      appearance: { cx: 0, cy: 0, width: 0.2, height: 0.2, img: "grey_ball.png" },
    });

    // we're going to win by "surviving" for 25 seconds... with no enemies, that
    // shouldn't be too hard.  Let's put the timer on the HUD, so the player
    // knows how much time remains.
    game.score.winCountRemaining = 25;
    let t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 2, cy: 2, center: false, face: "Arial", color: "#C0C0C0", size: 16, z: 2 },
      () => "" + (game.score.winCountRemaining ?? 0).toFixed(2) + "s remaining");

    // just to play it safe, let's say that we win on reaching a destination...
    // this ensures that collecting goodies or defeating enemies won't
    // accidentally cause us to win. Of course, with no destination, there's no
    // way to win now, except waiting for the countdown timer
    game.score.setVictoryDestination(1);

    // Let's put a button for pausing the game, so we can see that it pauses the
    // timer.  Notice that we have to draw it *after* the throw button, or else
    // the throw button will cover it.
    Helpers.addTapControl(game.hud,
      { cx: .5, cy: .5, width: .5, height: .5, img: "pause.png" },
      () => {
        game.installOverlay((overlay: Scene) => {
          let t = new Actor(overlay);
          t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#FFFFFF", size: 32, z: 0 },
            () => "Game Paused");
          Helpers.addTapControl(overlay,
            { cx: 8, cy: 4.5, width: 16, height: 9, img: "black.png", z: -1 },
            () => { game.clearOverlay(); return true; }
          );
        });
        return true;
      }
    );
  }

  // We can make a hero hover, and then have it stop hovering when it is flicked
  // or moved. This demonstrates the effect via flick. It also shows that an
  // enemy (or obstacle/goodie/destination) can fall due to gravity.
  else if (index == 66) {
    Helpers.resetGravity(0, 10);
    welcomeMessage("Flick the hero into the destination");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let boxCfg = { cx: 1, cy: 7, width: 1, height: 1, radius: 0.5, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(boxCfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);
    h.movement = new HoverFlick(1, 7, 0.7);
    Helpers.createFlickZone(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" });

    // place an enemy, let it fall
    let cfg = { cx: 15, cy: 1, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.role = new Enemy();
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    e.movement = new GravityMovement();

    // A destination.  You might need to flick the hero *while it's in the air*
    // to reach the destination
    cfg = { cx: 4, cy: 1, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);
  }

  // The default behavior is for a hero to be able to jump any time it collides
  // with an obstacle. This isn't, of course, the smartest way to do things,
  // since a hero in the air shouldn't jump.  One way to solve the problem is by
  // altering the pre-solve code in Collisions.ts. Another approach, which is
  // much simpler, is to mark some walls so that the hero doesn't have jump
  // re-enabled upon a collision.
  else if (index == 67) {
    Helpers.resetGravity(0, 10);
    Helpers.enableTilt(10, 0);
    welcomeMessage("Press the hero to make it jump");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });

    let cfg = { cx: 15, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 0.5, friction: 0.6 });
    h.movement = new TiltMovement();

    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    // the hero can jump while on this obstacle
    let boxCfg = { cx: 6, cy: 7, width: 3, height: 0.1, img: "red.png" };
    let o1 = new Actor(game.world);
    o1.appearance = new ImageSprite(boxCfg);
    o1.role = new Obstacle();
    o1.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { density: 1, friction: 0.5 });

    // the hero can't jump while on this obstacle
    boxCfg = { cx: 10, cy: 7, width: 3, height: 0.1, img: "red.png" };
    let o2 = new Actor(game.world);
    o2.appearance = new ImageSprite(boxCfg);
    o2.role = new Obstacle({ jumpReEnable: false });
    o2.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { density: 1, friction: 0.5 });
  }

  // When something chases an entity, we might not want it to chase in both the
  // X and Y dimensions... this shows how we can chase in a single direction.
  // It also shows how things can move through walls.
  else if (index == 68) {
    // set up a simple level
    Helpers.enableTilt(10, 10);
    welcomeMessage("You can walk through the wall");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // Make a hero who moves via tilt
    let cfg = { cx: 5.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "leg_star_1.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { passThroughId: 7 });
    h.movement = new TiltMovement();

    cfg = { cx: 14, cy: 2, radius: 1, width: 2, height: 2, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // These obstacles chase the hero, but only in one dimension
    cfg = { cx: .5, cy: 2.5, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    let left_enemy = new Actor(game.world);
    left_enemy.appearance = new ImageSprite(cfg);
    left_enemy.role = new Enemy();
    left_enemy.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { collisionsEnabled: true });
    left_enemy.movement = new BasicChase(15, h, false, true);

    cfg = { cx: 2.5, cy: .5, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    let top_enemy = new Actor(game.world);
    top_enemy.appearance = new ImageSprite(cfg);
    top_enemy.role = new Enemy();
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
    top_enemy.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { collisionsEnabled: true, dynamic: true });
    top_enemy.movement = new BasicChase(15, h, true, false);

    // Here's a wall, and a movable round obstacle
    let boxCfg = { cx: 7, cy: 1, width: 0.5, height: 5, img: "red.png" };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(boxCfg);
    o.role = new Obstacle();
    // The hero can pass through this wall, because both have the same
    // passthrough value.  Try changing the value to see what happens.
    o.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { passThroughId: 7 });

    cfg = { cx: 8, cy: 8, radius: 1, width: 2, height: 2, img: "blue_ball.png" };
    let o2 = new Actor(game.world);
    o2.appearance = new ImageSprite(cfg);
    o2.role = new Obstacle();
    o2.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    // TiltMovement automatically switches the obstacle to "dynamic", so it will
    // collide with the wall.
    o2.movement = new TiltMovement();
  }

  // In level 24, we poked an actor, then poked the screen, and the actor
  // teleported.  Here, we'll say that when we poke the screen, the actor starts
  // moving toward that point.
  else if (index == 69) {
    Helpers.drawBoundingBox(0, 0, 16, 9, .1);
    welcomeMessage("Poke the hero, then  where you want it to go.");
    winMessage("Great Job");
    loseMessage("Try Again");

    // Let's set up a hero
    let h_cfg = {
      cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4,
      idle_right: Helpers.makeAnimation({ timePerFrame: 200, repeat: true, images: ["leg_star_1.png", "leg_star_1.png"] }),
      idle_left: Helpers.makeAnimation({ timePerFrame: 200, repeat: true, images: ["flip_leg_star_8.png", "flip_leg_star_8.png"] })
    };
    let h = new Actor(game.world);
    h.appearance = new AnimatedSprite(h_cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(h_cfg, game.world);
    h.movement = new ExplicitMovement();

    // Like in poke-to-place, we need to "select" the entity with an initial tap
    h.gestures = { tap: () => { game.storage.setLevel("selected_entity", h); return true; } };
    // The "false" means that we don't have to poke hero, poke location, poke
    // hero, poke location, ... Instead, we can poke hero, poke location, poke
    // location, ...
    //
    // Be sure to move left/right/up/down, to see if the animations are working
    Helpers.createPokeToMoveZone(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, 5, false);

    let cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // sometimes a control needs to have a large touchable area, but a small
    // image. One way to do it is to make an invisible control, then put a
    // picture on top of it. If you need that, see level 25 for a way to draw
    // pictures on the HUD.
  }

  // It can be useful to make a hero stick to an obstacle. As an example, if the
  // hero should stand on a platform that moves along a path, then we will want
  // the hero to "stick" to it, even as the platform moves downward.
  else if (index == 70) {
    Helpers.resetGravity(0, 10);
    welcomeMessage("Press screen borders to move the hero");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 2, disableRotation: true });
    h.role = new Hero();
    h.movement = new ExplicitMovement();
    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    // create a destination.  Note that when you are testing this level, you
    // shouldn't just race to the destination.  You'll want to try out the
    // platforms
    cfg = { cx: 15.5, cy: 8.5, radius: .5, width: 1, height: 1, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    d.role = new Destination();
    game.score.setVictoryDestination(1);

    // This platform is sticky on top... Jump onto it and watch what happens
    let platform_cfg = { cx: 2, cy: 6, width: 2, height: 0.25, img: "red.png" };
    let sticky_platform = new Actor(game.world);
    sticky_platform.appearance = new ImageSprite(platform_cfg);
    // Be sure to try out bottomSticky, leftSticky, and rightSticky
    sticky_platform.rigidBody = RigidBodyComponent.Box(platform_cfg, game.world, { topSticky: true, density: 100, friction: 0.1 });
    sticky_platform.role = new Obstacle();
    sticky_platform.movement = new PathMovement(new Path().to(2, 6).to(4, 8).to(6, 6).to(4, 4).to(2, 6), 1, true);

    // This obstacle is not sticky... The hero can slip around on it
    //
    // It's tempting to think "I'll use some friction here", but isn't the
    // sticky platform nicer?
    platform_cfg = { cx: 11, cy: 6, width: 2, height: 0.25, img: "red.png" };
    let regular_platform = new Actor(game.world);
    regular_platform.appearance = new ImageSprite(platform_cfg);
    regular_platform.rigidBody = RigidBodyComponent.Box(platform_cfg, game.world, { density: 100, friction: 1 });
    regular_platform.role = new Obstacle();
    regular_platform.movement = new PathMovement(new Path().to(10, 6).to(12, 8).to(14, 6).to(12, 4).to(10, 6), 1, true);

    // draw some buttons for moving the hero
    Helpers.addToggleButton(game.hud, { cx: .5, cy: 4.5, width: 1, height: 8, img: "" },
      () => (h.movement as ExplicitMovement).updateXVelocity(-5),
      () => (h.movement as ExplicitMovement).updateXVelocity(0)
    );
    Helpers.addToggleButton(game.hud, { cx: 15.5, cy: 4.5, width: 1, height: 8, img: "" },
      () => (h.movement as ExplicitMovement).updateXVelocity(5),
      () => (h.movement as ExplicitMovement).updateXVelocity(0)
    );
  }

  // When the projectile isn't a circle we might want to rotate it in the
  // direction of travel. Also, this level shows how to do walls that can be
  // passed through in one direction.
  else if (index == 71) {
    Helpers.enableTilt(10, 10);
    welcomeMessage("Press anywhere to shoot a laser beam");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6, disableRotation: true });
    h.role = new Hero();
    h.movement = new TiltMovement();

    cfg = { cx: 15.25, cy: 8.25, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    d.role = new Destination();

    game.score.setVictoryDestination(1);

    // draw a button for throwing projectiles in many directions. It
    // only covers half the screen, to show how such an effect would
    // behave
    Helpers.addDirectionalThrowButton(game.hud,
      { cx: 4, cy: 4.5, width: 8, height: 9, img: "" }, h, 100, 0, 0);

    // set up a pool of projectiles with fixed velocity, and with
    // rotation
    game.world.projectiles = new ProjectileSystem(game.world, {
      maxAtOnce: 100, strength: 1, fixedVectorVelocity: 10, rotateVectorThrow: true,
      immuneToCollisions: true,
      body: { width: 0.02, height: .5, cx: -100, cy: -100 },
      appearance: { cx: 0, cy: 0, width: 0.02, height: 1, img: "red.png" },
    });

    // Warning!  If you make these projectiles any longer, and if you are not
    // careful about your offsets, you might find that they seem to "not shoot",
    // because you are too close to a wall, and the back of the projectile is
    // hitting the wall.

    // create a box that is easy to fall into, but hard to get out of,
    // by making its sides each "one-sided"
    let boxCfg = { cx: 4.5, cy: 3.1, width: 3, height: 0.2, img: "red.png" };
    let top = new Actor(game.world);
    top.appearance = new ImageSprite(boxCfg);
    top.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { bottomRigidOnly: true });
    top.role = new Obstacle();

    boxCfg = { cx: 3.1, cy: 4.5, width: 0.2, height: 3, img: "red.png" };
    let left = new Actor(game.world);
    left.appearance = new ImageSprite(boxCfg);
    left.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { rightRigidOnly: true });
    left.role = new Obstacle();

    boxCfg = { cx: 5.9, cy: 4.5, width: 0.2, height: 3, img: "red.png" };
    let right = new Actor(game.world);
    right.appearance = new ImageSprite(boxCfg);
    right.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { leftRigidOnly: true });
    right.role = new Obstacle();

    boxCfg = { cx: 4.5, cy: 7.5, width: 3, height: 0.2, img: "red.png" };
    let bottom = new Actor(game.world);
    bottom.appearance = new ImageSprite(boxCfg);
    bottom.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { topRigidOnly: true });
    bottom.role = new Obstacle();
  }

  // This level shows a bit more about using different goodie scores.  It's
  // really mean, because you need to get the exact right number of each goodie
  // type.
  else if (index == 72) {
    Helpers.enableTilt(10, 10);
    welcomeMessage("Green, Red, Blue, and Grey balls are goodies\nBut how many of each are needed?");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 8.25, radius: 0.4, width: 0.8, height: 0.8, img: "leg_star_1.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    h.movement = new TiltMovement();

    // the destination requires lots of goodies of different types
    //
    // Remember that we start counting from 0, so the four types are 0, 1, 2, 3
    cfg = { cx: 15.25, cy: 0.75, radius: 0.4, width: 0.8, height: 0.8, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination({
      onAttemptArrival: () => { return game.score.goodieCount[0] == 1 && game.score.goodieCount[1] == 2 && game.score.goodieCount[2] == 3 && game.score.goodieCount[3] == 1; }
    });
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    game.score.setVictoryDestination(1);

    // Announce how many of each goodie have been collected
    let t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 1, cy: 1, center: false, face: "Arial", color: "#00FFFF", size: 20, z: 2 },
      () => game.score.goodieCount[0] + " blue");
    t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 1, cy: 1.5, center: false, face: "Arial", color: "#00FFFF", size: 20, z: 2 },
      () => game.score.goodieCount[1] + " green");
    t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 1, cy: 2, center: false, face: "Arial", color: "#00FFFF", size: 20, z: 2 },
      () => game.score.goodieCount[2] + " red");
    t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 1, cy: 2.5, center: false, face: "Arial", color: "#00FFFF", size: 20, z: 2 },
      () => game.score.goodieCount[3] + " gray");

    // You only get 20 seconds to finish the level
    game.score.loseCountDownRemaining = 20;
    t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 15, cy: 8, center: false, face: "Arial", color: "#000000", size: 32, z: 2 },
      () => (game.score.loseCountDownRemaining ?? 0).toFixed() + "");

    // draw the goodies
    for (let i = 0; i < 3; ++i) {
      cfg = { cx: 5 + i + .5, cy: 1, radius: 0.125, width: 0.25, height: 0.25, img: "blue_ball.png" };
      let blue = new Actor(game.world);
      blue.appearance = new ImageSprite(cfg);
      blue.role = new Goodie({ onCollect: () => { game.score.goodieCount[0]++; return true; } });
      blue.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

      cfg = { cx: 5 + i + .5, cy: 2, radius: 0.125, width: 0.25, height: 0.25, img: "green_ball.png" };
      let green = new Actor(game.world);
      green.appearance = new ImageSprite(cfg);
      green.role = new Goodie({ onCollect: () => { game.score.goodieCount[1]++; return true; } });
      green.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

      cfg = { cx: 5 + i + .5, cy: 3, radius: 0.125, width: 0.25, height: 0.25, img: "red_ball.png" };
      let red = new Actor(game.world);
      red.appearance = new ImageSprite(cfg);
      red.role = new Goodie({ onCollect: () => { game.score.goodieCount[2]++; return true; } });
      red.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

      cfg = { cx: 5 + i + .5, cy: 4, radius: 0.125, width: 0.25, height: 0.25, img: "grey_ball.png" };
      let gray = new Actor(game.world);
      gray.appearance = new ImageSprite(cfg);
      gray.role = new Goodie({ onCollect: () => { game.score.goodieCount[3]++; return true; } });
      gray.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    }

    // When the hero collides with this obstacle, we'll increase the
    // time remaining
    let boxCfg = { cx: 14, cy: 8, width: 1, height: 1, radius: 0.5, img: "purple_ball.png" };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(boxCfg);
    o.role = new Obstacle({
      heroCollision: () => {
        // add 15 seconds to the timer, remove the obstacle
        game.score.loseCountDownRemaining! += 15;
        o.remove(true);
      }
    });
    o.rigidBody = RigidBodyComponent.Circle(boxCfg, game.world);
  }

  // this level shows passthrough objects and chase again, to help
  // get you thinking about chase and dynamic bodies
  else if (index == 73) {
    Helpers.enableTilt(10, 10);
    welcomeMessage("You can walk through the wall");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "leg_star_1.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { passThroughId: 7 });
    h.movement = new TiltMovement();

    cfg = { cx: 14, cy: 2, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    d.role = new Destination();

    game.score.setVictoryDestination(1);

    // the enemy chases the hero, but can't get through the wall
    cfg = { cx: 14, cy: 2, width: 0.5, height: 0.5, radius: 0.25, img: "red.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    // Remember to make it dynamic, or it *will* go through the wall
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { dynamic: true });
    e.role = new Enemy();
    e.movement = new BasicChase(1, h, true, true);

    let boxCfg = { cx: 12, cy: 1, width: 0.1, height: 7, img: "red.png" };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(boxCfg);
    o.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { passThroughId: 7 });
    o.role = new Obstacle();
  }

  // We can have a control that increases the hero's speed while pressed,
  // and decreases it upon release
  else if (index == 74) {
    Helpers.resetGravity(0, 10);
    welcomeMessage("Press anywhere to speed up");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 64, 9, .1, { density: 1 });

    let cfg = { cx: 63, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    let boxCfg = { cx: 2, cy: 4, width: 0.75, height: 1.5, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(boxCfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { density: 1, friction: 0, disableRotation: true });
    h.movement = new ExplicitMovement();
    // give the hero a fixed velocity
    h.movement.addVelocity(4, 0);

    // center the camera a little ahead of the hero
    game.world.camera.setCameraChase(h, 5, 0);
    game.world.camera.setBounds(64, 9);

    // set up the background
    game.backgroundColor = 0x17b4ff;
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // draw a turbo boost button that covers the whole screen... make sure its
    // "up" speed matches the hero velocity
    Helpers.addToggleButton(game.hud,
      { cx: 8, cy: 4.5, width: 16, height: 9, img: "" },
      () => (h.movement as ExplicitMovement).updateVelocity(15, 0),
      () => (h.movement as ExplicitMovement).updateVelocity(4, 0)
    );
  }

  // Sometimes, we want to make an actor move when we press a control, but when
  // we release we don't want an immediate stop. This shows how to achieve that
  // effect.
  else if (index == 75) {
    Helpers.resetGravity(0, 10);
    welcomeMessage("Press anywhere to start moving");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 64, 9, .1, { density: 1 });

    let cfg = { cx: 63, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    let boxCfg = { cx: 2, cy: 4, width: 0.75, height: 1.5, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(boxCfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { density: 1, friction: 0, disableRotation: true });
    h.movement = new ExplicitMovement();

    game.world.camera.setCameraChase(h, 5, 0);
    game.world.camera.setBounds(64, 9);

    game.backgroundColor = 0x17b4ff;
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // This control has a dampening effect, so that on release, the hero
    // slowly stops
    Helpers.addToggleButton(game.hud,
      { cx: 8, cy: 4.5, width: 16, height: 9, img: "" },
      Helpers.makeXYDampenedMotionAction(h, 10, 0, 0),
      Helpers.makeXYDampenedMotionAction(h, 10, 0, 1)
    );
  }

  // Here's the start of doodle jump.  The main idea is that the platform is
  // "one-sided", but also has a script that runs when the hero collides with
  // it, to give a jump-like boost.
  else if (index == 76) {
    Helpers.resetGravity(0, 10);
    Helpers.enableTilt(10, 0);
    welcomeMessage("One-sided + Callbacks");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1, friction: 0.5, disableRotation: true });
    h.movement = new TiltMovement();

    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    cfg = { cx: 15, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // create a platform that we can jump through from below
    let platform_cfg = { z: -1, cx: 3, cy: 7.5, width: 2, height: 0.2, img: "red.png" };
    let platform = new Actor(game.world);
    platform.appearance = new ImageSprite(platform_cfg);
    // Set a callback, then re-enable the platform's collision effect.
    platform.role = new Obstacle({ heroCollision: (_thisActor: Actor, collideActor: Actor) => (collideActor.movement as ExplicitMovement).updateYVelocity(-5) });
    platform.rigidBody = RigidBodyComponent.Box(platform_cfg, game.world, { collisionsEnabled: true, topRigidOnly: true });
  }

  // This level fleshes out some more poke-to-move stuff. Now we'll say
  // that once a hero starts moving, the player must re-poke the hero
  // before it can be given a new position. Also, the hero will keep
  // moving after the screen is released. We will also show the Fact
  // interface.
  else if (index == 77) {
    Helpers.drawBoundingBox(0, 0, 16, 9, .1);
    welcomeMessage("Poke the hero, then  where you want it to go.");
    winMessage("Great Job");
    loseMessage("Try Again");

    let h_cfg = {
      cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4,
      idle_right: Helpers.makeAnimation({ timePerFrame: 200, repeat: true, images: ["leg_star_1.png", "leg_star_1.png"] }),
      idle_left: Helpers.makeAnimation({ timePerFrame: 200, repeat: true, images: ["flip_leg_star_8.png", "flip_leg_star_8.png"] }),
    };
    let h = new Actor(game.world);
    h.appearance = new AnimatedSprite(h_cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(h_cfg, game.world, { density: 1, friction: 0.5 });
    h.movement = new ExplicitMovement();

    h.gestures = { tap: () => { game.storage.setLevel("selected_entity", h); return true; } };
    // Be sure to change to "false" and see what happens
    Helpers.createPokeToRunZone(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, 5, true);

    let cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

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
    let t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 1.25, cy: 0.5, center: false, face: "Arial", color: "#000000", size: 24, z: 2 },
      () => "Level: " + (game.storage.getLevel("level test") ?? -1));
    t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 1.25, cy: 1, center: false, face: "Arial", color: "#000000", size: 24, z: 2 },
      () => "Session: " + (game.storage.getSession("session test") ?? -1));
    t = new Actor(game.hud);
    t.appearance = new TextSprite({ cx: 1.25, cy: 1.5, center: false, face: "Arial", color: "#000000", size: 24, z: 2 },
      () => "Game: " + (game.storage.getPersistent("game test") ?? "-1"));

    Helpers.addTapControl(game.hud,
      { cx: .5, cy: 0.65, width: 0.5, height: 0.5, img: "red_ball.png" },
      () => {
        game.storage.setLevel("level test", "" + (1 + parseInt(game.storage.getLevel("level test") ?? -1)));
        return true;
      }
    );
    Helpers.addTapControl(game.hud,
      { cx: .5, cy: 1.15, width: 0.5, height: 0.5, img: "blue_ball.png" },
      () => {
        game.storage.setSession("session test", "" + (1 + parseInt(game.storage.getSession("session test") ?? -1)));
        return true;
      }
    );
    Helpers.addTapControl(game.hud,
      { cx: .5, cy: 1.65, width: 0.5, height: 0.5, img: "green_ball.png" },
      () => {
        game.storage.setPersistent("game test", "" + (1 + parseInt(game.storage.getPersistent("game test") ?? "-1")));
        return true;
      }
    );
  }

  // Sometimes we need to manually force an entity to be immune to
  // gravity.
  else if (index == 78) {
    Helpers.resetGravity(0, 10);
    Helpers.enableTilt(10, 0);
    welcomeMessage("Testing Gravity Defy?");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1, friction: 0.6, disableRotation: true });
    h.movement = new TiltMovement();

    h.gestures = { tap: () => { (h.role as Hero).jump(0, -15); return true; } }
    cfg = { cx: 15, cy: 4, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { dynamic: true });
    // When we attach a rigidBody and destination role to an actor, the
    // collisions get turned off.  Turn them back on, or the destination will go
    // through the wall.
    d.rigidBody.setCollisionsEnabled(true);

    // make the movement with an absolute velocity and with gravity defy turned
    // on.  Now it's a dynamic body, but gravity doesn't affect it.  It can
    // move, it can collide with obstacles, but it won't fall downward.
    d.movement = new ExplicitMovement();
    d.movement.setAbsoluteVelocity(-2, 0);
    d.movement.setGravityDefy();
    game.score.setVictoryDestination(1);
  }

  // This level shows that polygons with irregular shapes don't really shrink
  // nicely.  If that's going to be a problem for your game, you might want to
  // work on the shrink code and then share it with me :)
  else if (index == 79) {
    Helpers.enableTilt(10, 10);
    welcomeMessage("Testing Polygons");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { disableRotation: true });
    h.movement = new TiltMovement();

    cfg = { cx: 15, cy: 4, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // create a polygon obstacle
    // Be sure to turn on debug boxes in GameConfig.ts to see the true shape
    let polyCfg = { cx: 2, cy: 2, width: 2, height: 5, img: "blue_ball.png", vertices: [-1, 2, -1, 0, 0, -3, 1, 0, 1, 1] };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(polyCfg);
    o.role = new Obstacle();
    o.rigidBody = RigidBodyComponent.Polygon(polyCfg, game.world);

    Helpers.setShrinkOverTime(o, 0.1, 0.1, true);
  }

  // This level shows that we can defeat enemies by jumping on them
  else if (index == 80) {
    Helpers.resetGravity(0, 10);
    Helpers.enableTilt(10, 0);
    welcomeMessage("Press the hero to make it jump");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });
    game.score.setVictoryEnemyCount(1);

    // set up a simple jumping hero
    let boxCfg = { cx: 1, cy: 8, width: 1, height: 0.5, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(boxCfg);
    h.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);
    h.movement = new TiltMovement();
    h.role = new Hero();
    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    // This enemy can be defeated by jumping. We require that the hero is in
    // mid-jump (not falling off an obstacle) and that its center is higher than
    // the enemy's center.  If you want different conditions, you'll probably
    // want to change the Hero's onCollideWithEnemy function, in Role.ts.
    let cfg = { cx: 15, cy: 7, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.role = new Enemy({ defeatByJump: true });
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
  }

  // Joints are a powerful concept.  We'll just do a little demonstration here
  // for revolute joints, which let one rigid body revolve around another.  In
  // this demo, we'll have limits to the joints, kind of like pinball flippers.
  else if (index == 81) {
    Helpers.enableTilt(10, 10);
    welcomeMessage("The revolving obstacle will move the hero");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });

    let cfg = { cx: 5, cy: 8, width: 1, height: 1, radius: 0.5, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    h.movement = new TiltMovement();

    // Note: you must give density to the revolving part...
    let boxCfg = { cx: 1.5, cy: 4, width: 5, height: 1, img: "red.png" };
    let revolving = new Actor(game.world);
    revolving.appearance = new ImageSprite(boxCfg);
    revolving.role = new Obstacle();
    revolving.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { density: 1 });

    cfg = { cx: 7.5, cy: 4, width: 1, height: 1, radius: 0.5, img: "blue_ball.png" };
    let anchor = new Actor(game.world);
    anchor.appearance = new ImageSprite(cfg);
    anchor.role = new Obstacle();
    anchor.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1 });

    revolving.rigidBody!.setRevoluteJoint(anchor, 0, 0, 0, 2);
    // Add some limits, then give some speed to make it move
    revolving.rigidBody!.setRevoluteJointLimits(1.7, -1.7);
    revolving.rigidBody!.setRevoluteJointMotor(0.5, Number.POSITIVE_INFINITY);
    cfg = { cx: 15, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    // Notice that we can change the motor at any time...
    game.world.timer.addEvent(new TimedEvent(5, false, () => {
      // The order in which we do these changes doesn't matter :)
      revolving.rigidBody!.setRevoluteJointMotor(-.5, Number.POSITIVE_INFINITY);
      revolving.rigidBody!.setRevoluteJointLimits(1.7, -.5);
    }));

    game.score.setVictoryDestination(1);
  }

  // Demonstrate one-time callback controls
  else if (index == 82) {
    // start by setting everything up just like in level 1
    Helpers.enableTilt(10, 10);
    let cfg = { cx: 2, cy: 3, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    h.movement = new TiltMovement();

    cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);
    winMessage("Great Job");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1);
    welcomeMessage("Reach the destination\nto win this level");

    // add a pause button
    let hasPaused = false;
    let pause_button = Helpers.addTapControl(game.hud,
      { cx: 0.3, cy: 0.3, width: 0.5, height: 0.5, img: "pause.png" },
      () => {
        if (hasPaused) return false;
        hasPaused = true;
        game.installOverlay((overlay: Scene) => {
          Helpers.addTapControl(overlay,
            { cx: 8, cy: 4.5, width: 16, height: 9, img: "black.png" },
            () => { game.clearOverlay(); return true; }
          );
          let t = new Actor(overlay);
          t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#FFFFFF", size: 20, z: 0 },
            () => "you can only pause once...");
        });
        // When the pause button draws the pause screen, it also disables the
        // pause button, so there can be no more pausing...
        pause_button.enabled = false;
        return true;
      }
    );
  }

  // Here's another joint demo.  In this one, we weld an obstacle to the hero.
  // This might be useful if your hero needs to pick things up and move them
  // places.
  else if (index == 83) {
    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });
    let cfg = { cx: 15, cy: 1, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // set up a hero and fuse an obstacle to it
    cfg = { cx: 4, cy: 2, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    cfg = { cx: 1, cy: 1, width: 1, height: 1, radius: 0.5, img: "blue_ball.png" };
    let o = new Actor(game.world);
    o.appearance = new ImageSprite(cfg);
    o.role = new Obstacle();
    // Note that for the weld joint to work, you probably want the obstacle to
    // have a dynamic body.
    o.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { dynamic: true });
    o.movement = new ExplicitMovement();

    h.rigidBody!.setWeldJoint(o, 3, 0, 0, 0, 45);
  }

  // Sometimes it is useful for the pause scene to be interactive.  This could
  // let the pause scene be an inventory, or even a mini-game.  In this level,
  // we'll put some buttons on the pause scene, and let them do various
  // interesting things.
  else if (index == 84) {
    // We have a level that is un-winnable, because you need to defeat the
    // enemy, but don't have enough strength.
    Helpers.enableTilt(10, 10);
    welcomeMessage("The pause scene is interactive");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();

    cfg = { cx: 15, cy: 8, width: 0.8, height: 0.8, radius: 0.4, img: "red_ball.png" };
    let e = new Actor(game.world);
    e.appearance = new ImageSprite(cfg);
    e.role = new Enemy();
    e.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryEnemyCount(1);

    // Create a pause scene that has a back button on it, and a button
    // for pausing the level
    Helpers.addTapControl(
      game.hud,
      { cx: 0.5, cy: 0.5, width: .5, height: .5, img: "pause.png" },
      () => {
        game.installOverlay((overlay: Scene) => {

          // This button goes back to the Chooser
          Helpers.addTapControl(overlay,
            { cx: .75, cy: .75, width: .5, height: .5, img: "red_ball.png" },
            () => { game.clearOverlay(); game.switchTo(game.config.chooserBuilder, 4); return true; }
          );
          let t = new Actor(overlay);
          t.appearance = new TextSprite({ cx: 1.25, cy: 0.65, center: false, face: "Arial", color: "#FF0000", size: 24 }, () => "Back to chooser");

          // This one wins instantly
          Helpers.addTapControl(overlay,
            { cx: .75, cy: 1.75, width: .5, height: .5, img: "blue_ball.png" },
            () => { game.clearOverlay(); game.score.endLevel(true); return true; }
          );
          t = new Actor(overlay);
          t.appearance = new TextSprite({ cx: 1.25, cy: 1.65, center: false, face: "Arial", color: "#0000FF", size: 24 }, () => "Win Instantly");

          // This one loses instantly
          Helpers.addTapControl(overlay,
            { cx: .75, cy: 2.75, width: .5, height: .5, img: "purple_ball.png" },
            () => { game.clearOverlay(); game.score.endLevel(false); return true; });
          t = new Actor(overlay);
          t.appearance = new TextSprite({ cx: 1.25, cy: 2.65, center: false, face: "Arial", color: "#FF00FF", size: 24 }, () => "Lose Instantly");

          // This one opens another pause scene, to show how we can chain pause
          // scenes together
          Helpers.addTapControl(overlay,
            { cx: .75, cy: 3.75, width: .5, height: .5, img: "green_ball.png" },
            () => {
              // clear the pause scene, draw another one
              game.clearOverlay();
              game.installOverlay((overlay: Scene) => {
                Helpers.addTapControl(overlay, { cx: 8, cy: 4.5, width: 16, height: 9, img: "black.png" }, () => {
                  // In a pause scene, we can change things that are in the
                  // world, not just the HUD, so let's give the hero more
                  // strength
                  (h.role as Hero).strength = 10;
                  game.clearOverlay();
                  return true;
                });
                let t = new Actor(
                  overlay);
                t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#FFFFFF", size: 32, z: 0 },
                  () => "You are now powered up!");
              });
              return true;
            });
          t = new Actor(overlay);
          t.appearance = new TextSprite({ cx: 1.25, cy: 3.65, center: false, face: "Arial", color: "#00FF00", size: 24 }, () => "Another Pause Scene");
        });
        return true;
      });
  }

  // We might want to use heroes for unusual purposes in a game.  Sometimes
  // there is a "real" hero, though, who needs to not be defeated.  This level
  // shows how to do that.
  else if (index == 85) {
    welcomeMessage("Keep both heroes alive!");
    winMessage("Great Job");
    loseMessage("Try Again");

    Helpers.enableTilt(10, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });

    // This hero must survive
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let must_survive_hero = new Actor(game.world);
    must_survive_hero.appearance = new ImageSprite(cfg);
    must_survive_hero.role = new Hero({ mustSurvive: true });
    must_survive_hero.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1, friction: 0.6 });
    must_survive_hero.movement = new TiltMovement();

    // This hero is expendable, but if it makes it to the destination, it's
    // still a win
    cfg = { cx: 2.25, cy: 5.25, width: 0.8, height: 0.8, radius: .4, img: "purple_ball.png" };
    let spare_hero = new Actor(game.world);
    spare_hero.appearance = new ImageSprite(cfg);
    spare_hero.rigidBody = RigidBodyComponent.Box(cfg, game.world);
    spare_hero.role = new Hero();
    spare_hero.movement = new TiltMovement();

    // An enemy who chases the hero who must survive
    cfg = { cx: 15, cy: 0.1, width: 1, height: 1, radius: 0.5, img: "red_ball.png" };
    let e1 = new Actor(game.world);
    e1.appearance = new ImageSprite(cfg);
    e1.role = new Enemy();
    e1.rigidBody = RigidBodyComponent.Circle(cfg, game.world);
    e1.movement = new BasicChase(1, must_survive_hero, true, true);

    // A regular destination
    cfg = { cx: 15, cy: 7, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);
  }

  // It is possible for a button to control many Actors at once!
  else if (index == 86) {
    Helpers.resetGravity(0, 10);
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { elasticity: 1, friction: 0.1 });
    welcomeMessage("Keep pressing until a hero makes it to the destination");
    winMessage("Great Job");
    loseMessage("Try Again");

    // We're going to make a bunch of heroes, and save them in the "heroes"
    // array
    let heroes: Actor[] = [];
    for (let i = 0; i < 16; ++i) {
      let boxCfg = { cx: i + 0.2, cy: 8, width: 0.25, height: 0.25, img: "green_ball.png" };
      let h = new Actor(game.world);
      h.appearance = new ImageSprite(boxCfg);
      h.role = new Hero();
      h.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { density: 1, elasticity: 1, friction: 5 });
      h.movement = new ExplicitMovement();
      heroes.push(h);
    }

    // Here's a destination.  We need one hero to reach it
    let cfg = { cx: 7.5, cy: 0.25, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // Tapping this button will make all the heroes bounce a bit
    Helpers.addTapControl(game.hud, { cx: 8, cy: 4.5, width: 16, height: 9, img: "" }, () => {
      for (let h of heroes) {
        // The bounce is a bit chaotic in the x dimension, but always upward.
        (h.movement as ExplicitMovement).setAbsoluteVelocity(5 - Helpers.getRandom(10), -3);
      }
      return true;
    });
  }

  // We saw revolute joints earlier.  In this level, we'll make a joint without
  // any limits.  We can use it to drive a wheel, which means we can have
  // somewhat realistic physical propulsion.
  else if (index == 87) {
    Helpers.resetGravity(0, 10);
    // If the ground and wheels don't have friction, then this level won't work!
    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });

    // We'll make the body of our car as a hero with just a red square
    let boxCfg = { cx: 1, cy: 8, width: 2, height: 0.5, img: "red.png" };
    let truck = new Actor(game.world);
    truck.appearance = new ImageSprite(boxCfg);
    truck.role = new Hero();
    truck.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { density: 1 });

    let cfg = { cx: 0.75, cy: 8.5, width: 0.5, height: 0.5, radius: 0.25, img: "blue_ball.png" };
    let backWheel = new Actor(game.world);
    backWheel.appearance = new ImageSprite(cfg);
    backWheel.role = new Obstacle();
    backWheel.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 3, friction: 1 });
    backWheel.rigidBody.setRevoluteJoint(truck, -1, 0.5, 0, 0);
    backWheel.rigidBody.setRevoluteJointMotor(10, 10);

    cfg = { cx: 2.75, cy: 8.5, width: 0.5, height: 0.5, radius: 0.25, img: "blue_ball.png" };
    let frontWheel = new Actor(game.world);
    frontWheel.appearance = new ImageSprite(cfg);
    frontWheel.role = new Obstacle();
    frontWheel.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 3, friction: 1 });
    frontWheel.rigidBody.setRevoluteJoint(truck, 1, 0.5, 0, 0);
    frontWheel.rigidBody.setRevoluteJointMotor(10, 10);

    cfg = { cx: 15, cy: 8, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);
  }

  // This level shows how to make something that feels "infinite".  It also
  // shows "foreground" layers
  else if (index == 88) {
    // set up a standard side scroller, but make it really really long, to
    // emulate infinite length
    game.world.camera.setBounds(300000, 9);
    Helpers.resetGravity(0, 10);
    welcomeMessage("Press to make the hero go up");
    winMessage("Great Job");
    loseMessage("Try Again");
    Helpers.drawBoundingBox(0, 0, 300000, 9, .1);

    // make a hero, have the camera follow it
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 0.1, friction: 0, disableRotation: true });
    h.movement = new ExplicitMovement();
    h.movement.setAbsoluteVelocity(5, 0);
    game.world.camera.setCameraChase(h);

    // touching the screen makes the hero go upwards
    Helpers.addToggleButton(game.hud,
      { cx: 8, cy: 4.5, width: 16, height: 9, img: "" },
      () => (h.movement as ExplicitMovement).updateYVelocity(-5),
      () => (h.movement as ExplicitMovement).updateYVelocity(0)
    );

    // set up our background, with a few layers
    game.backgroundColor = 0x17b4ff;
    game.background.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "back.png" }), speed: 1 });
    game.background.addLayer({ appearance: new ImageSprite({ cx: 0, cy: 5, width: 16, height: 2.8, img: "front.png" }), speed: -0.5 });

    // Add a foreground layer
    game.foreground.addLayer({ appearance: new ImageSprite({ cx: 8, cy: 4.5, width: 16, height: 9, img: "mid.png" }), speed: 0 });

    // we win by collecting 10 goodies...
    game.score.setVictoryGoodies(10, 0, 0, 0);
    let t = new Actor(
      game.hud);
    t.appearance = new TextSprite({ cx: 1, cy: 1, center: false, face: "Arial", color: "#FFFFFF", size: 20, z: 2 },
      () => game.score.goodieCount[0] + " goodies");

    // This is a bit tricky... we don't want to create the whole level all at
    // once, so what we'll do is draw the first part, and then make a sensor
    // (which is just like an obstacle).  Every time the hero collides with the
    // sensor, we'll draw the next part of the world, and move the obstacle
    // forward some more.
    let boxCfg = { cx: 16, cy: 4.5, width: 1, height: 9, img: "" };
    let sensor = new Actor(game.world);
    sensor.appearance = new ImageSprite(boxCfg);
    sensor.role = new Sensor();
    sensor.rigidBody = RigidBodyComponent.Box(boxCfg, game.world);

    // The code for the sensor is complicated, so we'll make it as a function,
    // then attach it to the sensor.role.
    //
    // This code will run when the hero collides with the sensor
    let lc = function () {
      // Make a new enemy.  Notice that we use the sensor's location as the
      // starting point, and we add a random distance to it, so that the level
      // isn't too predictable.
      let cfg = {
        // It's at least 8 meters ahead of the sensor, so that we won't see it
        // appear on screen.
        cx: sensor.rigidBody!.getCenter().x + 8 + Helpers.getRandom(10),
        cy: .25 + Helpers.getRandom(8),
        width: 0.5, height: 0.5, radius: 0.25, img: "red_ball.png",
      };
      let next_enemy = new Actor(game.world);
      next_enemy.appearance = new ImageSprite(cfg);
      next_enemy.role = new Enemy();
      next_enemy.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

      // Now draw a goodie.  It should be at least 9 ahead of the sensor
      cfg = {
        cx: (sensor.rigidBody?.getCenter().x ?? 0) + 9 + Helpers.getRandom(10),
        cy: .25 + Helpers.getRandom(8),
        width: 0.5, radius: 0.25, height: 0.5, img: "blue_ball.png",
      };
      let next_goodie = new Actor(game.world);
      next_goodie.appearance = new ImageSprite(cfg);
      next_goodie.role = new Goodie();
      next_goodie.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

      // Move the sensor forward, so we can re-use it
      sensor.rigidBody!.setCenter(sensor.rigidBody!.getCenter().x + 16, 4.5);
    };

    // Finally, attach the code to the sensor
    sensor.role.heroCollision = lc;
  }

  // Drawing terrain by hand can be tedious.  In this level, we demonstrate
  // JetLag's rudimentary support for SVG files.  If you use Inkscape, or
  // another SVG tool, to make a picture that consists of only one line, then
  // you can import it into your game as a set of obstacles. Drawing a picture
  // on top of the obstacle is probably a good idea, though we don't bother in
  // this level
  else if (index == 89) {
    // We'll use tilt and jump to control the hero in this level
    game.world.camera.setBounds(32, 18);
    Helpers.enableTilt(10, 10);

    Helpers.drawBoundingBox(0, 0, 32, 18, .1, { density: 1, elasticity: .3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world);
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 5, friction: 0.6 });
    h.movement = new TiltMovement();
    game.world.camera.setCameraChase(h);

    cfg = { cx: 31, cy: 1, width: 1, height: 1, radius: 0.5, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 1, friction: 0.1 });

    game.score.setVictoryDestination(1);

    // draw an obstacle from SVG.  We are stretching it in the X and Y dimensions, and also
    // moving it rightward and upward
    SvgSystem.processFile("shape.svg", 5, 5, 2, 2, (actor: Actor) => {
      // This code is run each time a line of the SVG is drawn.  When we draw a line,
      // we'll give it some density and friction.  Remember that the line is
      // actually a rotated obstacle.
      actor.role = new Obstacle();
      actor.appearance = new ImageSprite({ cx: actor.rigidBody!.props.cx, cy: actor.rigidBody!.props.cy, width: actor.rigidBody!.props.w, height: actor.rigidBody!.props.h, img: "red.png" });
      actor.rigidBody!.setPhysics(1, .2, .4);
    });

    welcomeMessage("Obstacles can be drawn from SVG files");
    winMessage("Great Job");
    loseMessage("Try Again");
  }

  // We previously saw that we can have "sticky" actors, and also allow actors
  // to pass through other actors by making only certain sides rigid.  In this
  // example, we make sure they work together, by letting the hero jump through
  // a platform, and then stick to it.
  else if (index == 90) {
    Helpers.resetGravity(0, 10);
    welcomeMessage("Press screen borders to move the hero");
    winMessage("Great Job");
    loseMessage("Try Again");

    Helpers.drawBoundingBox(0, 0, 16, 9, .1, { density: 1, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, width: 0.8, height: 0.8, radius: 0.4, img: "green_ball.png" };
    let h = new Actor(game.world)
    h.appearance = new ImageSprite(cfg);
    h.role = new Hero();
    h.rigidBody = RigidBodyComponent.Circle(cfg, game.world, { density: 2, friction: 0.5, disableRotation: true });
    h.movement = new ExplicitMovement();
    h.gestures = { tap: () => { (h.role as Hero).jump(0, -10); return true; } }

    // create a destination
    cfg = { cx: 14, cy: 4, radius: 1, width: 2, height: 2, img: "mustard_ball.png" };
    let d = new Actor(game.world);
    d.appearance = new ImageSprite(cfg);
    d.role = new Destination();
    d.rigidBody = RigidBodyComponent.Circle(cfg, game.world);

    game.score.setVictoryDestination(1);

    // This obstacle is sticky on top, and only rigid on its top
    let boxCfg = { cx: 2, cy: 6, width: 2, height: 0.25, img: "red.png" };
    let sticky_platform = new Actor(game.world);
    sticky_platform.appearance = new ImageSprite(boxCfg);
    sticky_platform.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { topSticky: true, topRigidOnly: true, density: 100, friction: 0.1 });
    sticky_platform.role = new Obstacle();
    sticky_platform.movement = new PathMovement(new Path().to(2, 6).to(4, 8).to(6, 6).to(4, 4).to(2, 6), 1, true);

    // This obstacle is not sticky, and it is rigid on all sides
    boxCfg = { cx: 11, cy: 6, width: 2, height: 0.25, img: "red.png" };
    let normal_platform = new Actor(game.world)
    normal_platform.appearance = new ImageSprite(boxCfg);
    normal_platform.rigidBody = RigidBodyComponent.Box(boxCfg, game.world, { density: 100, friction: 1 });
    normal_platform.role = new Obstacle();
    normal_platform.movement = new PathMovement(new Path().to(10, 6).to(12, 8).to(14, 6).to(12, 4).to(10, 6), 1, true);

    // draw some buttons for moving the hero
    Helpers.addToggleButton(game.hud,
      { cx: .5, cy: 4.5, width: 1, height: 8, img: "" },
      () => (h.movement as ExplicitMovement).updateXVelocity(-5),
      () => (h.movement as ExplicitMovement).updateXVelocity(0)
    );
    Helpers.addToggleButton(game.hud,
      { cx: 15.5, cy: 4.5, width: 1, height: 8, img: "" },
      () => (h.movement as ExplicitMovement).updateXVelocity(5),
      () => (h.movement as ExplicitMovement).updateXVelocity(0)
    );
  }

  // You just made it to the last level.  Now it's time to reveal a little
  // secret...  No matter which "if" or "else if" the code did, it eventually
  // got down here, where we do three standard configuration tasks.

  // This line ensures that, no matter what level we draw, the ESCAPE key is
  // configured to go back to the Chooser.  index/24 makes sure we go to the
  // correct chooser screen.
  game.keyboard.setKeyUpHandler(KeyCodes.ESCAPE, () => game.switchTo(game.config.chooserBuilder, Math.ceil(index / 24)));

  // Put the level number in the top right corner of every level
  let t = new Actor(game.hud);
  t.appearance = new TextSprite({ cx: 15, cy: 0.5, center: false, face: "arial", color: "#872436", size: 22, z: 2 },
    () => "Level " + index);

  // Make sure we go to the correct level when this level is won/lost: for
  // anything but the last level, we go to the next level.  Otherwise, go to the splash screen
  if (index != 90) {
    game.score.levelOnFail = { index, which: StageTypes.PLAY };
    game.score.levelOnWin = { index: index + 1, which: StageTypes.PLAY };
  }
  else {
    game.score.levelOnFail = { index, which: StageTypes.PLAY };
    game.score.levelOnWin = { index: 1, which: StageTypes.SPLASH };
  }
}

/**
 * This is a standard way of drawing a black screen with some text, to serve as
 * the welcome screen for the game
 *
 * @param message The message to display
 */
export function welcomeMessage(message: string) {
  // Immediately install the overlay, to pause the game
  game.installOverlay((overlay: Scene) => {
    // Pressing anywhere on the black background will make the overlay go away
    Helpers.addTapControl(overlay, { cx: 8, cy: 4.5, width: 16, height: 9, img: "black.png" }, () => { game.clearOverlay(); return true; });
    // The text goes in the middle
    let t = new Actor(overlay);
    t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => message);
  });
}

/**
 * This is a standard way of drawing a black screen with some text, to serve as
 * the win screen for the game
 *
 * @param message   The message to display in the middle of the screen
 * @param callback  Code to run when the win message first appears
 */
export function winMessage(message: string, callback?: () => void) {
  game.score.winSceneBuilder = (overlay: Scene) => {
    Helpers.addTapControl(overlay, { cx: 8, cy: 4.5, width: 16, height: 9, img: "black.png" }, () => {
      // We need to be careful... we might go back to the chooser or splash!
      if (game.score.levelOnWin.which == StageTypes.PLAY)
        game.switchTo(game.config.levelBuilder, game.score.levelOnWin.index);
      else if (game.score.levelOnWin.which == StageTypes.CHOOSER)
        game.switchTo(game.config.chooserBuilder, game.score.levelOnWin.index);
      else if (game.score.levelOnWin.which == StageTypes.SPLASH)
        game.switchTo(game.config.splashBuilder, game.score.levelOnWin.index);
      return true;
    });
    let t = new Actor(overlay);
    t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 },
      () => message);
    if (callback) callback();
  };
}

/**
 * This is a standard way of drawing a black screen with some text, to serve as
 * the lose screen for the game
 *
 * @param message   The message to display in the middle of the screen
 * @param callback  Code to run when the lose message first appears
 */
export function loseMessage(message: string, callback?: () => void) {
  game.score.loseSceneBuilder = (overlay: Scene) => {
    Helpers.addTapControl(overlay, { cx: 8, cy: 4.5, width: 16, height: 9, img: "black.png" }, () => {
      // Just repeat the last level
      //
      // NB: we should be more careful, like in winMessage...
      game.switchTo(game.config.levelBuilder, game.score.levelOnFail.index);
      return true;
    });
    let t = new Actor(overlay);
    t.appearance = new TextSprite({ center: true, cx: 8, cy: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => message);
    if (callback) callback();
  };
}
