import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, ImageSprite } from "../jetlag/Components/Appearance";
import { GravityMovement, ManualMovement, ProjectileMovement, TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { Enemy, Hero, Obstacle, Projectile } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { ActorPoolSystem } from "../jetlag/Systems/ActorPool";
import { TimedEvent } from "../jetlag/Systems/Timer";
import { b2Vec2 } from "@box2d/core";
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
  imageNames = ["sprites.json"];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  stage.score.onLose = { level, builder };
  stage.score.onWin = { level, builder };

  if (level == 1) {
    // Projectiles are something that we can "toss" on the screen.  They are
    // unique among roles, because it really only makes sense to have a
    // Projectile role along with Projectile movement.
    boundingBox();
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }, { density: 2, disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    // Note that you could have different buttons, or different keys, for
    // tossing projectiles in a few specific directions
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
      let p = new Actor({
        appearance: new ImageSprite({ width: .2, height: .2, img: "grey_ball.png" }),
        rigidBody: new CircleBody({ cx: hero.rigidBody.getCenter().x + .2, cy: hero.rigidBody.getCenter().y, radius: .1 }),
        movement: new ProjectileMovement(),
        role: new Projectile()
      });
      // We can use "tossFrom" to throw in a specific direction, starting at a
      // point, such as the hero's center.
      (p.role as Projectile).tossFrom(hero, .2, 0, 5, 0);
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(-5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
    stage.world.setGravity(0, 10);
  }

  else if (level == 2) {
    // Making all of those projectiles is a bad idea... we'll end up with too
    // many, and the game will slow down.  We can use a "pool" to hold just
    // enough to make the game work:
    boundingBox();
    let projectiles = new ActorPoolSystem();
    for (let i = 0; i < 10; ++i) {
      // Where we put them doesn't matter, because the pool will disable them
      let p = new Actor({
        appearance: new ImageSprite({ width: .2, height: .2, img: "grey_ball.png" }),
        rigidBody: new CircleBody({ cx: -10, cy: -10, radius: .1 }),
        movement: new ProjectileMovement(),
        role: new Projectile()
      });
      projectiles.put(p);
    }
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }, { density: 2, disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
      let p = projectiles.get();
      if (p) (p.role as Projectile).tossFrom(hero, .2, 0, 5, 0);
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(-5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
    stage.world.setGravity(0, 10);
  }

  else if (level == 3) {
    // We ran out of projectiles!  Let's get them back into the pool:
    boundingBox();
    let projectiles = new ActorPoolSystem();
    for (let i = 0; i < 10; ++i) {
      // Where we put them doesn't matter, because the pool will disable them
      let p = new Actor({
        appearance: new ImageSprite({ width: .2, height: .2, img: "grey_ball.png" }),
        rigidBody: new CircleBody({ cx: -10, cy: -10, radius: .1 }),
        movement: new ProjectileMovement(),
        role: new Projectile({ reclaimer: (actor: Actor) => projectiles.put(actor) })
      });
      projectiles.put(p);
    }
    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }, { density: 2, disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
      let p = projectiles.get();
      if (p) (p.role as Projectile).tossFrom(hero, .2, 0, 5, 0);
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(-5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
    stage.world.setGravity(0, 10);

    // While there are 10 projectiles, we re-use them over and over again.  This
    // means there can never be more than 10 on the screen at a time.  If you
    // also wanted to limit the total number of tosses, we can do that, too:
    projectiles.setLimit(15);
    // You could use projectiles.getRemaining() to keep track of the remaining
    // number of shots.  And you could make power-ups that called setLimit() to
    // increase it.
  }

  if (level == 4) {
    // Projectiles don't have to be circles.  Here, we make them long, skinny
    // rectangles, so they look like laser beams
    boundingBox();

    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 8, cy: 4.5, radius: 0.4 }),
      movement: new TiltMovement(),
      role: new Hero(),
    });

    // set up a pool of projectiles with fixed velocity.  They will be rotated
    // in the direction they travel.
    let projectiles = new ActorPoolSystem();
    // set up the pool of projectiles
    for (let i = 0; i < 100; ++i) {
      let appearance = new FilledBox({ width: 0.02, height: 1, fillColor: "#FF0000" });
      let rigidBody = new BoxBody({ width: 0.02, height: .5, cx: -100, cy: -100 }, { collisionsEnabled: false });
      // let's not let gravity affect these projectiles
      rigidBody.setCollisionsEnabled(false);
      let reclaimer = (actor: Actor) => { projectiles.put(actor); }
      let role = new Projectile({ disappearOnCollide: true, reclaimer });
      let p = new Actor({ appearance, rigidBody, movement: new ProjectileMovement({ fixedVectorVelocity: 10, rotateVectorToss: true }), role });
      projectiles.put(p);
    }

    // Now let's cover the HUD with a button for shooting these "laser beams".
    // This will have the same "toggle" feeling from the Gesture tutorial.  But
    // we'll use gestures to figure out *where* to toss the projectile, and a
    // timer to limit the rate at which they are tossed.
    let v = new b2Vec2(0, 0);
    let isHolding = false;
    // On the initial touch, figure out where in the world it's happening
    let touchDown = (_actor: Actor, hudCoords: { x: number; y: number }) => {
      isHolding = true;
      let pixels = stage.hud.camera.metersToScreen(hudCoords.x, hudCoords.y);
      let world = stage.world.camera.screenToMeters(pixels.x, pixels.y);
      v.x = world.x;
      v.y = world.y;
      return true;
    };
    // On a release of the touch, stop tossing
    let touchUp = () => { isHolding = false; return true; };
    // Move will be the same as touchDown
    let panMove = touchDown;

    // Set up a timer to run on every render
    let mLastToss = 0;
    stage.world.repeatEvents.push(() => {
      if (isHolding) {
        let now = new Date().getTime();
        // Only throw once per 100 ms
        if (mLastToss + 100 < now) {
          mLastToss = now;
          // We can use "tossAt" to throw toward a specific point
          (projectiles.get()?.role as Projectile | undefined)?.tossAt(h.rigidBody?.getCenter().x ?? 0, h.rigidBody?.getCenter().y ?? 0, v.x, v.y, h, 0, 0);
        }
      }
    });

    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: stage.hud }),
      gestures: { touchDown, touchUp, panMove }
    });

    // Warning!  If your projectiles seem to "not shoot", it might be because
    // they are colliding with something.
  }

  if (level == 5) {
    // What happens if projectiles go "too far"?  We might want to put them back
    // in the pool before they collide with something off-screen.  Also, when we
    // toss a projectile, we could randomly pick its image.
    //
    // Also, we didn't really get into *why* one would want projectiles.  Let's
    // use them to defeat enemies!
    boundingBox();
    stage.world.setGravity(0, 10);

    let hero = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 0.25, cy: 5.25, radius: 0.4 }, { density: 2, disableRotation: true }),
      movement: new ManualMovement(),
      role: new Hero(),
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(-5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_LEFT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(5, hero.rigidBody.getVelocity().y); });
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_RIGHT, () => { (hero.movement as ManualMovement).setAbsoluteVelocity(0, hero.rigidBody.getVelocity().y); });
    stage.world.setGravity(0, 10);

    // set up the pool of projectiles
    let projectiles = new ActorPoolSystem();
    for (let i = 0; i < 3; ++i) {
      let appearance = new ImageSprite({ img: "color_star_1.png", width: 0.5, height: 0.5, z: 0 });
      let rigidBody = new CircleBody({ radius: 0.25, cx: -100, cy: -100 });
      rigidBody.setCollisionsEnabled(false);
      let reclaimer = (actor: Actor) => { projectiles.put(actor); }
      let role = new Projectile({ damage: 2, disappearOnCollide: true, reclaimer });
      // Put in some code for eliminating the projectile quietly if it has
      // traveled too far
      let range = 5;
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
      p.rigidBody.body.SetGravityScale(0);
      projectiles.put(p);
    }

    let images = ["color_star_1.png", "color_star_2.png", "color_star_3.png", "color_star_4.png"];
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
      let p = projectiles.get();
      if (!p) return;
      (p.appearance as ImageSprite).setImage(images[Math.trunc(Math.random() * 4)]);
      (p.role as Projectile).tossFrom(hero, .2, 0, 5, 0);
      p.rigidBody.body.SetAngularVelocity(4);
    });

    // draw some enemies to defeat
    for (let i = 0; i < 5; i++) {
      new Actor({
        appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
        rigidBody: new CircleBody({ cx: 2 + 2 * i, cy: 8.5, radius: 0.5 }),
        role: new Enemy({ damage: i + 1 }),
      });
    }
  }

  else if (level == 6) {
    // This level is reminiscent of games where you need to keep asteroids from
    // hitting the ground. Note that now, the velocity of the projectile will
    // depend on the distance between the hero and the touch point
    stage.world.setGravity(0, 3);

    // We won't have a bounding box, just a floor:
    new Actor({
      appearance: new FilledBox({ width: 32, height: .1, fillColor: "#ff0000" }),
      rigidBody: new BoxBody({ cx: 16, cy: 9.05, width: 32, height: .1 }),
      role: new Obstacle(),
    });

    let cfg = { cx: 8.5, cy: 0.5, width: 1, height: 1, radius: 0.5, img: "green_ball.png" };
    let h = new Actor({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg),
      role: new Hero(),
    });

    stage.score.setVictoryEnemyCount(20);

    // Set up our pool of projectiles.  With this throwing mechanism, the farther from the
    // hero we press, the faster the projectile goes, so we multiply the velocity by .8 to
    // slow it down a bit
    let projectiles = new ActorPoolSystem();
    for (let i = 0; i < 100; ++i) {
      // Be sure to explore the relationship between setCollisionsEnabled and disappearOnCollide
      let appearance = new ImageSprite({ width: 0.25, height: 0.25, img: "grey_ball.png", z: 0 });
      let rigidBody = new CircleBody({ radius: 0.125, cx: -100, cy: -100 });
      rigidBody.body.SetGravityScale(0); // immune to gravity
      rigidBody.setCollisionsEnabled(true); // No bouncing on a collision
      let reclaimer = (actor: Actor) => { projectiles.put(actor); }
      let role = new Projectile({ damage: 2, disappearOnCollide: true, reclaimer });
      // Put in some code for eliminating the projectile quietly if it has
      // traveled too far
      let range = 10;
      role.prerenderTasks.push((_elapsedMs: number, actor?: Actor) => {
        if (!actor) return;
        if (!actor.enabled) return;
        let role = actor.role as Projectile;
        let body = actor.rigidBody.body;
        let dx = Math.abs(body.GetPosition().x - role.rangeFrom.x);
        let dy = Math.abs(body.GetPosition().y - role.rangeFrom.y);
        if ((dx * dx + dy * dy) > (range * range)) reclaimer(actor);
      });
      let p = new Actor({ appearance, rigidBody, movement: new ProjectileMovement({ multiplier: .8 }), role });
      projectiles.put(p);
    }

    let v = new b2Vec2(0, 0);
    let isHolding = false;
    let touchDown = (_actor: Actor, hudCoords: { x: number; y: number }) => {
      isHolding = true;
      let pixels = stage.hud.camera.metersToScreen(hudCoords.x, hudCoords.y);
      let world = stage.world.camera.screenToMeters(pixels.x, pixels.y);
      v.x = world.x;
      v.y = world.y;
      return true;
    };
    let touchUp = () => { isHolding = false; return true; };
    let panMove = touchDown;
    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: stage.hud }),
      gestures: { touchDown, touchUp, panMove },
    });

    let mLastToss = 0;
    stage.world.repeatEvents.push(() => {
      if (isHolding) {
        let now = new Date().getTime();
        if (mLastToss + 50 < now) {
          mLastToss = now;
          let p = projectiles.get();
          if (p) (p.role as Projectile).tossAt(h.rigidBody.getCenter().x, h.rigidBody.getCenter().y, v.x, v.y, h, 0, -.5);
        }
      }
    });

    // We'll set up a timer, so that enemies keep falling from the sky
    stage.world.timer.addEvent(new TimedEvent(1, true, () => {
      // get a random number between 0.0 and 15.0
      let x = Math.trunc(Math.random() * 151) / 10;
      new Actor({
        appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
        rigidBody: new CircleBody({ cx: x, cy: -1, radius: 0.5 }),
        movement: new GravityMovement(),
        role: new Enemy(),
      });
    }));

  }

  else if (level == 7) {
    // We'll wrap up with a level where the hero can jump and toss projectiles.
    // It needs to get projectiles into the basket to win.
    stage.world.setGravity(0, 10);
    boundingBox();

    // Make a hero
    let h = new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .4, cy: 0.4, radius: 0.4 }),
      role: new Hero(),
      gestures: { tap: () => { (h.role as Hero).jump(0, -10); return true; } }
    });

    // draw a bucket as three rectangles
    //
    // We want to make it so that when the ball hits the obstacle (the bucket),
    // it doesn't disappear. The only time a projectile does not disappear when
    // hitting an obstacle is when you provide custom code to run on a
    // projectile/obstacle collision, and that code returns false. In that case,
    // you are responsible for removing the projectile (or for not removing it).
    // That being the case, we can provide code that just returns false, and
    // that'll do the job.
    new Actor({
      appearance: new FilledBox({ width: 0.1, height: 1, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 8.95, cy: 3.95, width: 0.1, height: 1 }),
      role: new Obstacle({ projectileCollision: () => false }),
    });
    new Actor({
      appearance: new FilledBox({ width: 0.1, height: 1, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 10.05, cy: 3.95, width: 0.1, height: 1 }),
      role: new Obstacle({ projectileCollision: () => false }),
    });
    new Actor({
      appearance: new FilledBox({ width: 1.2, height: 0.1, fillColor: "#FF0000" }),
      rigidBody: new BoxBody({ cx: 9.5, cy: 4.4, width: 1.2, height: 0.1 }),
      role: new Obstacle({ projectileCollision: () => false }),
    });

    // Place an enemy in the bucket, and require that it be defeated
    new Actor({
      appearance: new ImageSprite({ width: 0.8, height: 0.8, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 9.5, cy: 3.9, radius: 0.4 }),
      movement: new GravityMovement(),
      role: new Enemy({ damage: 4 }),
    });
    stage.score.setVictoryEnemyCount();

    // Set up a projectile pool so we can toss balls at the basket
    let projectiles = new ActorPoolSystem();
    for (let i = 0; i < 5; ++i) {
      let appearance = new ImageSprite({ width: 0.5, height: 0.5, img: "grey_ball.png", z: 0 });
      let rigidBody = new CircleBody({ radius: 0.25, cx: -100, cy: -100 });
      rigidBody.body.SetGravityScale(1); // turn on gravity
      rigidBody.setCollisionsEnabled(true); // Collisions count... this should bounce off the basket
      let reclaimer = (actor: Actor) => { projectiles.put(actor); }
      let role = new Projectile({ damage: 1, disappearOnCollide: true, reclaimer });
      let p = new Actor({ appearance, rigidBody, movement: new ProjectileMovement({ multiplier: 2 }), role });
      projectiles.put(p);
    }

    // cover "most" of the screen with a button for throwing projectiles.  This
    // ensures that we can still tap the hero to make it jump
    new Actor({
      appearance: new FilledBox({ width: 15, height: 9, fillColor: "#00000000" }),
      rigidBody: new BoxBody({ cx: 8.5, cy: 4.5, width: 15, height: 9 }, { scene: stage.hud }),
      gestures: {
        tap: (_actor: Actor, hudCoords: { x: number; y: number }) => {
          let pixels = stage.hud.camera.metersToScreen(hudCoords.x, hudCoords.y);
          let world = stage.world.camera.screenToMeters(pixels.x, pixels.y);
          let p = projectiles.get(); if (!p) return true;
          (p.role as Projectile).tossAt(h.rigidBody.getCenter().x, h.rigidBody.getCenter().y, world.x, world.y, h, 0, 0);
          return true;
        }
      }
    });

    // put a hint on the screen after 15 seconds to show where to click to ensure that
    // projectiles hit the enemy
    stage.world.timer.addEvent(new TimedEvent(15, false, () => {
      new Actor({
        appearance: new ImageSprite({ width: 0.2, height: 0.2, img: "purple_ball.png" }),
        rigidBody: new CircleBody({ cx: 2.75, cy: 2.4, radius: 0.1 }, { collisionsEnabled: false }),
        role: new Obstacle({ projectileCollision: () => false }),
      });
    }));
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);
