import { initializeAndLaunch } from "../jetlag/Stage";
import { JetLagGameConfig } from "../jetlag/Config";
import { FilledBox, ImageSprite, TextSprite } from "../jetlag/Components/Appearance";
import { ProjectileMovement, TiltMovement } from "../jetlag/Components/Movement";
import { BoxBody, CircleBody } from "../jetlag/Components/RigidBody";
import { Destination, Enemy, Goodie, Hero, Projectile } from "../jetlag/Components/Role";
import { Actor } from "../jetlag/Entities/Actor";
import { KeyCodes } from "../jetlag/Services/Keyboard";
import { stage } from "../jetlag/Stage";
import { Scene } from "../jetlag/Entities/Scene";
import { enableTilt, boundingBox } from "./common";
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
  imageNames = ["sprites.json"];
}

/**
 * Build the levels of the game.
 *
 * @param level Which level should be displayed
 */
function builder(level: number) {
  // In this tutorial, we're going to briefly discuss how scores work in JetLag.
  // JetLag tracks a lot of information while your game is playing, through
  // `stage.score`.  Below are the main score items, which you might want to
  // print on the HUD in your game:
  //
  // - stage.score.getDestinationArrivals()
  // - stage.score.getEnemiesDefeated()
  // - stage.score.getEnemiesCreated()
  // - stage.score.getGoodieCount(i) // i in (0,1,2,3)
  // - stage.score.getHeroesDefeated()
  // - stage.score.getHeroesCreated()
  // - stage.score.getLoseCountdownRemaining()
  // - stage.score.getStopwatch()
  // - stage.score.getWinCountdownRemaining()

  // Along with this, you'll note that there are several ways to defeat an
  // enemy:
  // - Hero collides with it, hero is invincible
  // - Hero collides with it, hero strength > enemy damage
  // - Projectile collides with it, decreases its damage
  // - Hero jumps on it, it's able to be defeated by jump
  // - Hero crawls into it, it's able to be defeated by crawl
  // - You call enemy.defeat() on the enemy, e.g., in an obstacle callback,
  //   gesture callback, or timer.

  // There are several ways to set up how a game is won
  // - Defeat a specific number of enemies
  // - Defeat all enemies
  // - Collect a certain amount of goodies (of each type)
  // - Have enough heroes reach destinations
  // - Survive for long enough
  // - You call score.winLevel()

  // Finally, there are a few ways to set up how a game is lost
  // - All heroes are defeated
  // - A specific, important hero is defeated
  // - Time runs out
  // - You call score.loseLevel()

  // Let's try each of these out...

  // first, set up winning and losing to both restart
  stage.score.onLose = { level, builder };
  stage.score.onWin = { level, builder };
  winMessage("Yay");
  loseMessage("Try Again");

  // Put all the info on the screen
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => "Arrivals: " + stage.score.getDestinationArrivals()),
    rigidBody: new CircleBody({ cx: .1, cy: .1, radius: .01 }, { scene: stage.hud })
  });
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => "Defeated: " + stage.score.getEnemiesDefeated() + " / " + stage.score.getEnemiesCreated()),
    rigidBody: new CircleBody({ cx: .1, cy: .4, radius: .01 }, { scene: stage.hud })
  });
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => "Goodies: " + stage.score.getGoodieCount(0) + ", " + stage.score.getGoodieCount(1) + ", " + stage.score.getGoodieCount(2) + ", " + stage.score.getGoodieCount(3)),
    rigidBody: new CircleBody({ cx: .1, cy: .7, radius: .01 }, { scene: stage.hud })
  });
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => "Heroes: " + stage.score.getHeroesDefeated() + " / " + stage.score.getHeroesCreated()),
    rigidBody: new CircleBody({ cx: .1, cy: 1, radius: .01 }, { scene: stage.hud })
  });
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => "Stopwatch: " + stage.score.getStopwatch().toFixed(2)),
    rigidBody: new CircleBody({ cx: .1, cy: 1.3, radius: .01 }, { scene: stage.hud })
  });
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => "FPS: " + stage.renderer.getFPS().toFixed(2)),
    rigidBody: new CircleBody({ cx: .1, cy: 1.6, radius: .01 }, { scene: stage.hud })
  });
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => stage.score.getWinCountdownRemaining() ? "Time Until Win: " + stage.score.getWinCountdownRemaining()?.toFixed(2) : ""),
    rigidBody: new CircleBody({ cx: .1, cy: 1.9, radius: .01 }, { scene: stage.hud })
  });
  new Actor({
    appearance: new TextSprite({ center: false, face: "Arial", size: 20, color: "#000000" }, () => stage.score.getLoseCountdownRemaining() ? "Time Until Lose: " + stage.score.getLoseCountdownRemaining()?.toFixed(2) : ""),
    rigidBody: new CircleBody({ cx: .1, cy: 1.9, radius: .01 }, { scene: stage.hud })
  });

  // Set up some movement
  enableTilt(10, 10);
  boundingBox();

  if (level == 1) {
    // Automatically win in 5 seconds
    stage.score.setVictorySurvive(5);
  }

  else if (level == 2) {
    // Automatically lose in 5 seconds
    stage.score.setLoseCountdownRemaining(5);
  }

  else if (level == 3) {
    // Defeat all the enemies via collision
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 10 })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 2.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 3.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
    });
    stage.score.setVictoryEnemyCount();
  }

  else if (level == 4) {
    // Defeat via invincibility
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 1 })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 2.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect: (_g: Actor, h: Actor) => { (h.role as Hero).invincibleRemaining = 10; return true; } }),
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 3.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
    });
    stage.score.setVictoryEnemyCount(2);
  }

  else if (level == 5) {
    // Defeat via crawl
    let h = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero()
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).crawlOn(Math.PI / 2))
    stage.keyboard.setKeyUpHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).crawlOff(Math.PI / 2))
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Enemy({ defeatByCrawl: true }),
    });
    stage.score.setVictoryEnemyCount(1);
  }

  else if (level == 6) {
    // Defeat via jump
    stage.world.setGravity(0, 10);
    let h = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero()
    });
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => (h.role as Hero).jump(0, -7.5))
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Enemy({ defeatByJump: true }),
    });
    stage.score.setVictoryEnemyCount(1);
  }

  else if (level == 7) {
    // Defeat via projectile
    let h = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero()
    });
    // Note that you could have different buttons, or different keys, for
    // tossing projectiles in a few specific directions
    stage.keyboard.setKeyDownHandler(KeyCodes.KEY_SPACE, () => {
      let p = new Actor({
        appearance: new ImageSprite({ width: .2, height: .2, img: "grey_ball.png" }),
        rigidBody: new CircleBody({ cx: h.rigidBody.getCenter().x + .2, cy: h.rigidBody.getCenter().y, radius: .1 }),
        movement: new ProjectileMovement(),
        role: new Projectile()
      });
      // We can use "tossFrom" to throw in a specific direction, starting at a
      // point, such as the hero's center.
      (p.role as Projectile).tossFrom(h, .2, 0, 5, 0);
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
    });
    stage.score.setVictoryEnemyCount(1);
  }

  else if (level == 8) {
    // Defeat via code

    // Defeating this one doesn't actually count!
    const e = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
      gestures: { tap: () => { (e.role as Enemy).defeat(false); return true; } }
    });
    const e2 = new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 5.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
      gestures: { tap: () => { (e2.role as Enemy).defeat(true); return true; } }
    });
    stage.score.setVictoryEnemyCount(1);
  }

  else if (level == 9) {
    // Win via goodie count
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 10 })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 2.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(0, 1); return true; } }),
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 3.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(1, 1); return true; } }),
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(2, 1); return true; } }),
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "blue_ball.png" }),
      rigidBody: new CircleBody({ cx: 5.5, cy: 8.5, radius: .5 }),
      role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(3, 1); return true; } }),
    });
    stage.score.setVictoryGoodies(1, 1, 1, 1);
  }

  else if (level == 10) {
    // Win via destination (single destination)
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 10 })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1.5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 10 })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Destination({ capacity: 2 })
    });
    stage.score.setVictoryDestination(2);
  }

  else if (level == 11) {
    // Win via destination (multiple destinations)
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 10 })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1.5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ strength: 10 })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 3.5, cy: 8.5, radius: .5 }),
      role: new Destination({ capacity: 1 })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "mustard_ball.png" }),
      rigidBody: new CircleBody({ cx: 4.5, cy: 8.5, radius: .5 }),
      role: new Destination({ capacity: 1 })
    });
    stage.score.setVictoryDestination(2);
  }

  else if (level == 12) {
    // Win via code
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      gestures: { tap: () => { stage.score.winLevel(); return true; } }
    });
  }

  else if (level == 13) {
    // Lose because all heroes defeated
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero()
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1.5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero()
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 3.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
    });
    stage.score.setVictoryEnemyCount();
  }

  else if (level == 14) {
    // Lose because important hero defeated
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero()
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "green_ball.png" }),
      rigidBody: new CircleBody({ cx: 1.5, cy: 8.5, radius: .5 }),
      movement: new TiltMovement(),
      role: new Hero({ mustSurvive: true })
    });
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: 3.5, cy: 8.5, radius: .5 }),
      role: new Enemy(),
    });
    stage.score.setVictoryEnemyCount();
  }

  else if (level == 15) {
    // Lose via code
    new Actor({
      appearance: new ImageSprite({ width: 1, height: 1, img: "red_ball.png" }),
      rigidBody: new CircleBody({ cx: .5, cy: 8.5, radius: .5 }),
      gestures: { tap: () => { stage.score.loseLevel(); return true; } }
    });
  }
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new Config(), builder);

/**
 * Create an overlay (blocking all game progress) consisting of a black screen
 * with text.  Clearing the overlay will start the next level.
 *
 * @param message A message to display in the middle of the screen
 */
function winMessage(message: string) {
  stage.score.winSceneBuilder = (overlay: Scene) => {
    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
      gestures: {
        tap: () => {
          stage.clearOverlay();
          stage.switchTo(stage.score.onWin.builder, stage.score.onWin.level);
          return true;
        }
      },
    });
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, message),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, { scene: overlay }),
    });
  };
}

/**
 * Create an overlay (blocking all game progress) consisting of a black screen
 * with text.  Clearing the overlay will restart the level.
 *
 * @param message A message to display in the middle of the screen
 */
function loseMessage(message: string) {
  stage.score.loseSceneBuilder = (overlay: Scene) => {
    new Actor({
      appearance: new FilledBox({ width: 16, height: 9, fillColor: "#000000" }),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: 16, height: 9 }, { scene: overlay }),
      gestures: {
        tap: () => {
          stage.clearOverlay();
          stage.switchTo(stage.score.onLose.builder, stage.score.onLose.level);
          return true;
        }
      },
    });
    new Actor({
      appearance: new TextSprite({ center: true, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, message),
      rigidBody: new BoxBody({ cx: 8, cy: 4.5, width: .1, height: .1 }, { scene: overlay }),
    })
  };
}
