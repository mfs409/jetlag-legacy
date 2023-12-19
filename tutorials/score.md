*** Score (score; ready)
This isn't even made yet!
  else if (level == 9) {
    // JetLag tracks a lot of information while your game is playing, through
    // the `stage.score`.  Below are a few of the things you might want to print
    // on the HUD in your game:
    //
    // - stage.score.getDestinationArrivals()
    // - stage.score.getEnemiesDefeated()
    // - stage.score.getGoodieCount(0)
    // - stage.score.getHeroesDefeated()
    // - stage.score.getLoseCountdownRemaining()
    // - stage.score.getStopwatch()
    // - stage.score.getWinCountdownRemaining()
    //
  }

    // start with a hero who is controlled via Joystick
    drawBoundingBox(0, 0, 16, 9, .1, { density: 1, elasticity: 0.3, friction: 1 });
    let cfg = { cx: 0.25, cy: 5.25, radius: 0.4, width: 0.8, height: 0.8, img: "green_ball.png" };
    let h = Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world, { density: 5, friction: 0.6 }),
      movement: new StandardMovement(),
      role: new Hero(),
    });

    addJoystickControl(stage.hud, { cx: 1, cy: 7.5, width: 1.5, height: 1.5, img: "grey_ball.png" }, { actor: h, scale: 5 });

    // Set up a destination that requires 7 type-1 goodies
    cfg = { cx: 15, cy: 1, width: 0.8, height: 0.8, radius: 0.4, img: "mustard_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Destination({ onAttemptArrival: () => { return stage.score.getGoodieCount(0) >= 7; } }),
    });

    stage.score.setVictoryDestination(1);

    // This goodie **reduces** your score
    cfg = { cx: 9, cy: 1, radius: 0.25, width: 0.5, height: 0.5, img: "blue_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(0, -2); return true; } }),
    });

    // This goodie **increases** your score
    cfg = { cx: 9, cy: 6, radius: 0.25, width: 0.5, height: 0.5, img: "blue_ball.png" };
    Actor.Make({
      appearance: new ImageSprite(cfg),
      rigidBody: new CircleBody(cfg, stage.world),
      role: new Goodie({ onCollect: () => { stage.score.addToGoodieCount(0, 9); return true; } }),
    });

    // print a goodie count to show how the count goes up and down
    makeText(stage.hud,
      { cx: 7, cy: 8.5, center: false, width: .1, height: .1, face: "Arial", color: "#3C46FF", size: 18, z: 2 },
      () => "Your score is: " + stage.score.getGoodieCount(0));

    welcomeMessage("Collect 'the right' blue balls to activate destination");
    winMessage("Great Job");
  }
