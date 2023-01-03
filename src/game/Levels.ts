import { JetLagApi } from "../jetlag/api/JetLagApi";
import { OverlayApi } from "../jetlag/api/OverlayApi";
import { Path } from "../jetlag/support/Path";
import { Goodie } from "../jetlag/actor/Goodie";
import { Hero } from "../jetlag/actor/Hero";
import { WorldActor } from "../jetlag/actor/WorldActor";
import { Enemy } from "../jetlag/actor/Enemy";
import { JetLagKeys } from "../jetlag/support/JetLagKeys";
import { Obstacle } from "../jetlag/actor/Obstacle";

/**
 * buildLevelScreen is used to draw the playable levels of the game
 *
 * We currently have 90 levels, each of which is described in part of the
 * following function.
 *
 * @param index Which level should be displayed
 * @param jl    The JetLag object, for putting stuff into the level
 */
export function buildLevelScreen(index: number, jl: JetLagApi): void {

    // This line ensures that, no matter what level we draw, the ESCAPE key is configured to go back to the Chooser
    jl.setUpKeyAction(JetLagKeys.ESCAPE, () => { jl.nav.doChooser(Math.ceil(index / 24)); });

    // In this level, all we have is a hero (the green ball) who needs to make it to the destination (a mustard colored
    // ball). The game is configured to use tilt to control the world.  If you're running on a computer, arrow keys will
    // simulate tilt.
    if (index == 1) {
        // By default, we have a level that is 1600x900 pixels (16x9 meters), with no default gravitational forces

        // Turn on tilt support, and indicate that the maximum force is +/- 10 m/(s^2) in each of the X and Y dimensions
        jl.world.enableTilt(10, 10);

        // Create a circular hero whose top left corner is at (2, 3), who is .75 meters wide, .75 meters high, and who
        // looks like a green ball.  Note that "greenball.png" is in the assets folder, and it is listed in the
        // myconfig.ts file
        let h = jl.world.makeHero({ x: 2, y: 3, width: .75, height: .75, img: "greenball.png" });

        // The hero moves via phone tilt
        h.setMoveByTilting();

        // draw a circular destination, and indicate that the level is won when the hero reaches the destination
        //
        // Note: the parameters to makeDestinationAsCircle() are the same as the parameters for making heroes.  If you
        // aren't sure what something means, hover your mouse over it and you'll get pop-up help
        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // Specify a message to print when the level is won
        //
        // Note: there is actually a lot of code behind making this message.  It all appears at the bottom of this file,
        // as a function.  Later, we'll  explore the function, and we will also see how to make different sorts of win
        // messages
        winMessage(jl, "Great Job");
    }

    // In the last level, the green ball could go off screen.  In this level, we draw a bounding box around the level so
    // that can't happen.  We also use a welcome message to put some text on the screen when the level starts.
    else if (index == 2) {
        // start by setting everything up just like in level 1
        jl.world.enableTilt(10, 10);
        let h = jl.world.makeHero({ x: 2, y: 3, width: .75, height: .75, img: "greenball.png" });
        h.setMoveByTilting();
        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        winMessage(jl, "Great Job");

        // add a bounding box so the hero can't fall off the screen.  Hover your mouse over 'drawBoundingBox' to learn
        // about what the parameters mean.
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 0, 0, 0);

        // In the same way that we make "win" messages, we can also make a "welcome" message to show before the level
        // starts.  Again, there is a lot of code involved in making a welcome message, which we will explore later on
        welcomeMessage(jl, "Reach the destination\nto win this level");
    }

    // In this level, we change the physics from level 2 so that things roll and bounce a little bit more nicely.
    else if (index == 3) {
        // start by setting everything up just like in level 2
        jl.world.enableTilt(10, 10);
        let h = jl.world.makeHero({ x: 2, y: 3, width: .75, height: .75, img: "greenball.png" });
        h.setMoveByTilting();
        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        welcomeMessage(jl, "When the hero hits a wall at an angle, the hero should spin");
        winMessage(jl, "JetLag is FUN!");

        // give the hero some density (5) and friction (.6).  The friction helps
        // it to roll when it encounters a wall.  The density makes it
        // accelerate more slowly
        h.setPhysics(5, 0, 0.6);

        // Assign some density (1), elasticity (.3), and friction (.9) to the 
        // bounding box.
        //
        // Note: we need friction on the hero and the bounding box or we won't
        // get the hero to roll
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, .9);
    }

    // It's confusing to have multiple active heroes in a level, but we can... 
    // this shows how to have multiple destinations and heroes
    else if (index == 4) {
        // Enable tilt and set up a bounding box
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, .9);

        // Now let's draw two heroes who can both move by tilting, and who both
        // have density and friction. Note that we lower the density, so they
        // move faster than in the previous level
        let h1 = jl.world.makeHero({ x: 4, y: 7, width: .75, height: .75, img: "greenball.png" });
        h1.setPhysics(5, 0, 0.6);
        h1.setMoveByTilting();
        let h2 = jl.world.makeHero({ x: 6, y: 7, width: .75, height: .75, img: "greenball.png" });
        h2.setPhysics(5, 0, 0.6);
        h2.setMoveByTilting();

        // We will make two destinations, each of which defaults to only holding
        // ONE hero, but we still need to have two heroes reach destinations in
        // order to complete the level
        jl.world.makeDestination({ x: 15, y: 1, width: .75, height: .75, img: "mustardball.png" });
        jl.world.makeDestination({ x: 15, y: 7, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(2);

        welcomeMessage(jl, "Each destination can hold one hero\n\nBoth heroes must reach a destination to win this level")
        winMessage(jl, "Great Job");
    }

    // This level demonstrates that we can have many heroes that can reach the
    // same destination.  It also shows a sound effect.
    else if (index == 5) {
        // Configure things like in the previous level
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h1 = jl.world.makeHero({ x: 4, y: 7, width: .75, height: .75, img: "greenball.png" });
        h1.setPhysics(5, 0, 0.6);
        h1.setMoveByTilting();
        let h2 = jl.world.makeHero({ x: 6, y: 7, width: .75, height: .75, img: "greenball.png" });
        h2.setPhysics(5, 0, 0.6);
        h2.setMoveByTilting();

        // Make ONE destination, but indicate that it can hold TWO heroes
        let d = jl.world.makeDestination({ x: 15, y: 1, width: .75, height: .75, img: "mustardball.png" });
        d.setCapacity(2);

        // Let's also say that whenever a hero reaches the destination, a sound
        // will play
        d.setArrivalSound("hipitch.ogg");

        // Notice that this line didn't change from level 4: we still need a
        // total of 2 heroes reaching destinations
        jl.score.setVictoryDestination(2);

        welcomeMessage(jl, "All heroes must\nreach the destination");
        winMessage(jl, "Great Job");
    }

    // Tilt can be used to control velocity, instead of applying forces to the
    // entities on the screen. It doesn't always work well, but it's a nice
    // option to have...
    else if (index == 6) {
        // By now, these lines should be familiar, so we will stop describing
        // them in each new level
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: 4, y: 7, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        jl.world.makeDestination({ x: 15, y: 1, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        welcomeMessage(jl, "Tilt can change velocity, instead of\n" + "applying a force to actors.");
        winMessage(jl, "Great Job");

        // change the behavior of tilt
        jl.world.setTiltAsVelocity(true);
    }

    // So far, it has been impossible to lose a level.  In this level, we add an
    // Enemy actor.  If the hero collides with the Enemy, the level will be
    // lost, and there will be an option to try again.
    else if (index == 7) {
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: 4, y: 7, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        jl.world.makeDestination({ x: 15, y: 1, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        welcomeMessage(jl, "Avoid the enemy and\nreach the destination");
        winMessage(jl, "Great Job");

        // draw an enemy... we don't need to give it physics for now because it
        // will be stationary
        jl.world.makeEnemy({ x: 14, y: 1.5, width: .75, height: .75, img: "redball.png" });

        // When the level is lost, we will print a message.  Later on, we will
        // explore how the loseMessage() function really works.
        loseMessage(jl, "Try again");
    }

    // This level explores a bit more of what we can do with enemies, by having
    // an enemy that moves along a fixed path.  Note that every actor can move
    // along a fixed path, not just enemies.
    else if (index == 8) {
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: 4, y: 7, width: .75, height: .75, img: "greenball.png" });
        h.setMoveByTilting();
        jl.world.makeDestination({ x: 15, y: 1, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        welcomeMessage(jl, "Avoid the enemy and\nreach the destination");

        // Draw an enemy, and attach a path to it.
        //
        // The path will have two points.  The first is (14, 8.25), and the
        // second is (14, 0).  Note what happens when the path repeats: we
        // never say "there is a third point that is the same as the start
        // point", so the enemy teleports back to the starting point after it
        // reaches (14, 0).
        let e = jl.world.makeEnemy({ x: 14, y: 1.5, width: .75, height: .75, img: "redball.png" });
        e.setPath(new Path().to(14, 8.25).to(14, 0), 4, true);

        // Note that if we don't explicitly call winMessage() and loseMessage(),
        // then when the player wins or loses, gameplay will immediately 
        // (re)start the appropriate level. Be sure to test the game by losing
        // *and* winning!
    }

    // This level also puts an enemy on a path, but now the path has three 
    // points, so that the enemy returns to its starting point
    else if (index == 9) {
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: 4, y: 7, width: .75, height: .75, img: "greenball.png" });
        h.setMoveByTilting();
        jl.world.makeDestination({ x: 15, y: 1, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // Notice how the Enemy path has 3 points, so that it travels back and
        // forth.  Paths can be made extremely complex.  Be sure to try a lot
        // of variations.
        let e = jl.world.makeEnemy({ x: 14, y: 1.5, width: .75, height: .75, img: "redball.png" });
        e.setPath(new Path().to(14, 8.25).to(10, 0).to(14, 8.25), 4, true);

        welcomeMessage(jl, "Avoid the enemy and\nreach the destination");
        loseMessage(jl, "Try Again");
        winMessage(jl, "Great Job");
    }

    // In this level, we will explore the way that all of our different actors
    // can be modified using the same codes.  All actors can rotate, so we'll
    // make the destination rotate.  All actors can move via tilt, so the hero
    // *and* enemy will.
    else if (index == 10) {
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: 4, y: 7, width: .75, height: .75, img: "greenball.png" });
        h.setMoveByTilting();
        let d = jl.world.makeDestination({ x: 15, y: 1, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // Make the Destination do a complete rotation once per second
        d.setRotationSpeed(1);

        // Make an enemy who moves due to tilt
        let e = jl.world.makeEnemy({ x: 14, y: 1.5, width: .75, height: .75, img: "redball.png" });
        e.setPhysics(5, 0.3, 0.6);
        e.setMoveByTilting();

        // Play some music
        jl.setMusic("tune.ogg");

        winMessage(jl, "Great Job");
        loseMessage(jl, "Better luck next time...");
        welcomeMessage(jl, "The enemy is also controlled by tilt.");
    }

    // This shows that it is possible to make a level that is larger than a screen.
    //
    // This level also introduces the "heads up display" (the "HUD").  We can put information on
    // the HUD, and we can also draw actors on the hud who we can touch in order to achieve new
    // behaviors.  In this case, we'll put zoom-in and zoom-out buttons on the HUD.
    else if (index == 11) {
        // make the level really big
        jl.world.setCameraBounds(64, 36);

        // We'll use tilt, and we need a bounding box
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 64, 36, "", 0, 0, 0);

        // put the hero and destination far apart
        let h = jl.world.makeHero({ x: 1, y: 1, width: .75, height: .75, img: "greenball.png" });
        h.setMoveByTilting();
        h.setPhysics(5, 0, 0.6);
        jl.world.makeDestination({ x: 63, y: 35, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // By default, the camera is centered on the point 8, 4.5f.  We can instead have the
        // camera stay centered on the hero, so that we can keep seeing the hero as it moves
        // around the world
        jl.world.setCameraChase(h);

        // add zoom buttons. We are using blank images, which means that the buttons will be
        // invisible... that's nice, because we can make the buttons big (covering the left and
        // right halves of the screen).  When debug rendering is turned on, we'll be able to see
        // an outline of the two rectangles. You could also use images (that you registered,
        // of course), but if you did, you'd either need to make them small (maybe by drawing
        // some pictures in addition to Tap controls), or make them semi-transparent.
        jl.hud.addTapControl({ x: 0, y: 0, width: 8, height: 9, img: "" }, () => {
            if (jl.world.getZoom() > 50)
                jl.world.setZoom(jl.world.getZoom() - 10);
            return true;
        });
        jl.hud.addTapControl({ x: 8, y: 0, width: 16, height: 9, img: "" }, () => {
            if (jl.world.getZoom() < 200)
                jl.world.setZoom(jl.world.getZoom() + 20);
            return true;
        });

        // As the hero moves around, it's going to be hard to see that it's really moving.  Draw
        // some "noise" in the background, so that we can see that the hero really is moving
        //
        // The "-1" for the last parameter is pretty important.  In JetLag, there are 5
        // "layers", from -2 to 2.  The default is for things to go on the "0" layer, and then
        // for things added to a layer later to cover things added to a layer earlier.  If we
        // didn't tuck the noise into layer -1, it would cover the hero and destination that we
        // drew above.
        for (let x = 0; x < 64; x += 16) {
            for (let y = 0; y < 36; y += 9) {
                jl.world.drawPicture({ x: x, y: y, width: 16, height: 9, img: "noise.png", z: -1 });
            }
        }

        welcomeMessage(jl, "Press left to zoom out\nright to zoom in");
        winMessage(jl, "Great Job");
    }

    // Obstacles are an important kind of actor.  They can be as simple as walls (indeed, our
    // bounding box is really four obstacles), or they can do more complex things.  In this
    // level, we draw a few obstacles.  Also, all actors can be circles, boxes, or polygons.  We
    // will play around with circle, polygon, and box shapes in this level.
    //
    // We will also use a control to move the hero, instead of tilt.
    //
    // This level also shows how the "welcomeMessage" code works
    else if (index == 12) {
        // Put a border around the level, and create a hero and destination
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: 1, y: 5, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // Draw a joystick on the HUD, and have the joystick control the hero.  This will appear
        // as a grey circle in the bottom left corner of the screen.
        jl.hud.addJoystickControl({ x: 0, y: 7.5, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, true);

        // We will now create four obstacles.  Two will use a red rectangle as their picture,
        // and two will use a purple ball.  In terms of physics, two will be boxes, two will be
        // circles.  The debug flag (see myconfig.ts) causes outlines to draw, which reveal
        // the actual physics shape.
        let o1 = jl.world.makeObstacle({ box: true, x: 5, y: 5, width: .75, height: .75, img: "purpleball.png" });
        o1.setPhysics(1, 0, 1);
        let o2 = jl.world.makeObstacle({ x: 7, y: 2, width: .75, height: .75, img: "purpleball.png" });
        o2.setPhysics(1, 0, 1);
        let o3 = jl.world.makeObstacle({ x: 9, y: 4, width: 3, height: 0.5, img: "red.png" });
        o3.setPhysics(1, 0, 1);
        let o4 = jl.world.makeObstacle({ box: true, x: 9, y: 7, width: 0.5, height: 2, img: "red.png" });
        o4.setPhysics(1, 0, 1);

        // Oblong circles are not what you'd expect
        jl.world.makeHero({ x: 13, y: 2, width: 2, height: 1, img: "purpleball.png" });
        jl.world.makeDestination({ x: 13, y: 2, width: 2, height: 1, img: "purpleball.png" });
        jl.world.makeObstacle({ x: 13, y: 2, width: 2, height: 1, img: "purpleball.png" });
        jl.world.makeEnemy({ x: 13, y: 2, width: 2, height: 1, img: "redball.png" });
        jl.world.makeGoodie({ x: 13, y: 2, width: 2, height: 1, img: "purpleball.png" });

        // Create a polygon obstacle
        jl.world.makeObstacle({ x: 2, y: 2, width: 2, height: 5, img: "blueball.png", verts: [-1, 2, -1, 0, 0, -3, 1, 0, 1, 1] });

        winMessage(jl, "Great Job");

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
        jl.nav.setWelcomeSceneBuilder((overlay: OverlayApi) => {
            // We are going to put a big black button over the whole screen.
            // Clicking it will get rid of this overlay
            overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "black.png" }, (_hudX: number, _hudY: number) => {
                jl.nav.dismissOverlayScene();
                return true;
            });
            // On top of the button, we will write some text, centered around
            // the center of the screen
            overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => "An obstacle's appearance may\nnot match its physics");
            // Note that we are putting tap controls and text on 'overlay', but
            // we can still access jl.world.  This means, for example, that you
            // could have a button that lets the user choose a character, and
            // then use jl.world to add that character as the hero :)
        });
    }

    // This level plays around with physics a little bit, to show how friction and elasticity
    // can do interesting things.
    //
    // It also does some new tricks with the welcome scene overlay
    else if (index == 13) {
        // Put a border around the level, and create a hero and destination.  Control the hero
        // with a joysitck
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: 1, y: 5, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        // note: releasing the joystick no longer stops the hero
        jl.hud.addJoystickControl({ x: 0, y: 0, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, false);

        // These obstacles have interesting elasticity and friction values
        let o1 = jl.world.makeObstacle({ x: 4, y: 8, width: .75, height: .75, img: "purpleball.png" });
        o1.setPhysics(0, 100, 0);
        let o2 = jl.world.makeObstacle({ x: 4, y: 1, width: .75, height: .75, img: "purpleball.png" });
        o2.setPhysics(10, 0, 100);

        winMessage(jl, "Great Job");

        // On this welcome scene, we will have multiple texts, with different font
        // colors.  We will also have an image.  Lastly, the scene won't
        // disappear by clicking.  Instead, it will disappear after a few
        // seconds.  Note that the timer for dismissing is a callback within a 
        // callback
        jl.nav.setWelcomeSceneBuilder((overlay: OverlayApi) => {
            overlay.addImage({ x: 0, y: 0, width: 16, height: 9, img: "black.png" });
            overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => "Obstacles can have different amounts\nof friction and elasticity");
            overlay.addText({ x: 0, y: 0, face: "Arial", color: "#00FFFF", size: 12, z: 0 }, () => "(Releasing the joystick does not stop the hero anymore)");
            overlay.addTimer(4, false, () => { jl.nav.dismissOverlayScene(); });
        });
    }

    // This level introduces goodies. Goodies are something that we collect.  We can make the
    // collection of goodies lead to changes in the behavior of the game, and in this example,
    // the collection of goodies "enables" a destination.
    else if (index == 14) {
        // set up a hero, destination, bounding box, and joystick
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: 1, y: 5, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        let d = jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        jl.hud.addJoystickControl({ x: 0, y: 0, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, false);

        // Add some stationary goodies.
        //
        // Note that the default is for goodies to not cause a change in the hero's movement at
        // the time when a collision occurs... this is often called being a "sensor"
        //
        // Note that JetLag tracks four different scores for goodies.  By default, collecting a
        // goodie increases the "type 1" score by 1.
        jl.world.makeGoodie({ x: 0, y: 8, width: .5, height: .5, img: "blueball.png" });
        jl.world.makeGoodie({ x: 0, y: 7, width: .5, height: .5, img: "blueball.png" });

        // Indicate that the destination won't accept heroes until the score is
        // at least 2,0,0,0.  We achieve this by adding a bit of code to the
        // destination.  The code will run whenever a hero collides with the
        // destination, and returns true only if we want to let the hero in.
        d.setOnAttemptArrival(() => { return jl.score.getGoodies1() >= 2; });

        // let's put a display on the screen to see how many type-1 goodies we've collected.
        // This finally shows a situation where a prefix or suffix is useful when adding text
        //
        // Note: jl.score.getGoodies1 is one of quite a few available displays
        jl.hud.addText({ x: .25, y: 8.5, face: "Arial", color: "#FF00FF", size: 20, z: 2 }, () => jl.score.getGoodies1() + "/2 Goodies");

        welcomeMessage(jl, "You must collect two blue balls.\nThen the destination will work");

        // Set up a win scene that also plays a sound.  This should look familiar.  And, as you can imagine, we can do lose scenes too.
        jl.nav.setWinSceneBuilder((overlay: OverlayApi) => {
            overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "black.png" }, (_hudx: number, _hudY: number) => {
                jl.nav.nextLevel();
                return true;
            });
            overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => "Great Job");
            jl.playSound("winsound.ogg");
        });
    }

    // Earlier, we saw that enemies could move along a path. So can any other actor, so we'll
    // move destinations, goodies, and obstacles, too.
    else if (index == 15) {
        // start with a hero who is controlled via Joystick
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: 1, y: 8, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        jl.hud.addJoystickControl({ x: 0, y: 7.5, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, false);

        // make a destination that moves, and that requires one goodie to be collected before it
        // works
        let d = jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        d.setOnAttemptArrival(() => { return jl.score.getGoodies1() >= 1; });
        d.setPath(new Path().to(15, 8).to(15, .25).to(15, 8), 4, true);
        jl.score.setVictoryDestination(1);

        // make an obstacle that moves
        let o = jl.world.makeObstacle({ box: true, x: 0, y: 0, width: 1, height: 1, img: "purpleball.png" });
        o.setPhysics(0, 100, 0);
        o.setPath(new Path().to(0, 0).to(8, 8).to(0, 0), 2, true);

        // make a goodie that moves
        let g = jl.world.makeGoodie({ x: 5, y: 5, width: .5, height: .5, img: "blueball.png" });
        g.setPath(new Path().to(3, 3).to(6, 3).to(6, 6).to(3, 6).to(3, 3), 10, true);

        // draw a goodie counter in light blue (60, 70, 255) with a 12-point font
        jl.hud.addText({ x: .05, y: 8, face: "Arial", color: "#3C46FF", size: 12, z: 2 }, () => jl.score.getGoodies1() + " Goodies");

        welcomeMessage(jl, "Every actor can move...");
        winMessage(jl, "Great Job");
    }

    // Sometimes, we don't want a destination, we just want to say that the player wins by
    // collecting enough goodies.  This level also shows that we can set a time limit for the
    // level, and we can pause the game.
    else if (index == 16) {
        // Set up a hero who is controlled by the joystick
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: 15, y: 8, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        jl.hud.addJoystickControl({ x: 0, y: 7.5, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, false);

        // draw 5 goodies
        for (let p = 0; p < 5; p++)
            jl.world.makeGoodie({ x: p, y: p + 4, width: .25, height: .25, img: "blueball.png" });

        // indicate that we win by collecting enough goodies
        jl.score.setVictoryGoodies(5, 0, 0, 0);

        // put the goodie count on the screen
        jl.hud.addText({ x: 0, y: 8, face: "Arial", color: "#3C46FF", size: 12, z: 2 }, () => jl.score.getGoodies1() + "/5 Goodies");

        // put a simple countdown on the screen.  The first line says "15 seconds", the second
        // actually draws something on the screen showing remaining time
        jl.score.setLoseCountdown(15);
        jl.world.addText({ x: 0, y: 7, face: "Arial", color: "#000000", size: 32, z: 2 }, () => jl.score.getLoseCountdown().toFixed(0));

        // let's also add a screen for pausing the game. In a real game, every level should have
        // a button for pausing the game, and the pause scene should have a button for going
        // back to the main menu... we'll show how to do that later.
        //
        // The way this works is it says "draw a button that, when pressed,
        // tells JetLag how to draw a pause scene".  Whenever JetLag sees that
        // it's possible to draw a pause scene, it will draw it, so this will
        // cause the game to switch to a pause scene until the overlay gets
        // dismissed
        jl.hud.addTapControl({ x: 15, y: 0, width: 1, height: 1, img: "red.png" }, (): boolean => {
            jl.nav.setPauseSceneBuilder((overlay: OverlayApi) => {
                overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "black.png" }, (_hudx: number, _hudY: number) => {
                    jl.nav.dismissOverlayScene();
                    return true;
                });
                overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 32, z: 0 }, () => "Game Paused");
            });
            return true;
        });

        welcomeMessage(jl, "Collect all blue balls to win\n" + "Tap red to pause");
        loseMessage(jl, "Time Up");
        winMessage(jl, "Great Job");
    }

    // This level shows how "obstacles" need not actually impede the hero's movement. Here, we
    // transform our obstacles into "pads", so that the hero can speed up or slow down when it
    // passes *over* the obstacle
    // This level also adds a stopwatch. Stopwatches don't have any effect on gameplay yet.
    // This level also has a Pause scene.
    else if (index == 17) {
        // start with a hero who is controlled via tilt, and a destination
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: 3, y: 3, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // Make the stopwatch start counting, by giving it an initial value of 0
        jl.score.setStopwatch(0);

        // Draw the stopwatch on the HUD
        jl.hud.addText({ x: .1, y: 8, face: "Arial", color: "#000000", size: 32, z: 2 }, () => jl.score.getStopwatch().toFixed(0));

        // Put a button on the HUD to pause the game
        jl.hud.addTapControl({ x: 0.1, y: 8.5, width: .4, height: .4, img: "pause.png" }, () => {
            jl.nav.setPauseSceneBuilder((overlay: OverlayApi) => {
                overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "noise.png" }, (_hudx: number, _hudY: number) => {
                    jl.nav.dismissOverlayScene();
                    return true;
                });
                overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#000000", size: 32, z: 0 }, () => "Game Paused");
                overlay.addTapControl({ x: 0.1, y: 8.5, width: .4, height: .4, img: "backarrow.png" }, () => {
                    jl.nav.dismissOverlayScene();
                    jl.nav.doSplash(1);
                    return true;
                });
            });
            return true;
        });

        // now draw three obstacles, with different "pad" effects.  Note, too, that the Z-index
        // completely controls if the hero goes over or under two of these.  For the third, an
        // index of 0 (the default), coupled with it being drawn after the hero, means the hero
        // still goes under it

        // This pad effect multiplies by -1, causing a "bounce off" effect
        let o = jl.world.makeObstacle({ x: 5, y: 3, width: .75, height: .75, img: "purpleball.png" });
        o.setPad(-10);

        // This pad multiplies by five, causing a speedup
        o = jl.world.makeObstacle({ x: 7, y: 3, width: .75, height: .75, img: "purpleball.png" });
        o.setPad(5);

        // A fraction causes a slowdown, and we'll make this one spin
        o = jl.world.makeObstacle({ box: true, x: 9, y: 3, width: .75, height: .75, img: "purpleball.png" });
        o.setRotationSpeed(2);
        o.setPad(0.2);

        welcomeMessage(jl, "Obstacles as zoom, strips, friction pads, " + "and repellers");
        winMessage(jl, "Great Job");
    }

    // This level shows that it is possible to give heroes and enemies different strengths, so
    // that a hero doesn't disappear after a single collision. It also shows that when an enemy
    // defeats a hero, we can customize the message that prints
    else if (index == 18) {
        // set up a basic jl.world.  Note that we will use tilt to control the hero and one enemy
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // draw a hero and give it strength of 10. The default is for enemies to have "2" units
        // of damage, and heroes to have "1" unit of strength, so that any collision defeats the
        // hero without removing the enemy.
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        h.setStrength(10);

        // draw a strength meter to show this hero's strength.  Note that we are using a suffix
        // parameter to the addDisplay() function
        jl.world.addText({ x: .1, y: 8.5, face: "Arial", color: "#000000", size: 32, z: 2 }, () => h.getStrength() + " Strength");

        // our first enemy stands still:
        let e = jl.world.makeEnemy({ x: 8, y: 8, width: .5, height: .5, img: "redball.png" });
        e.setPhysics(1.0, 0.3, 0.6);
        e.setRotationSpeed(1);
        e.setDamage(4);
        let endText = "Try Again"
        // this text will be displayed if this enemy defeats the hero
        e.setOnDefeatHero(() => { endText = "How did you hit me?"; });

        // our second enemy moves along a path
        e = jl.world.makeEnemy({ x: 7, y: 7, width: .5, height: .5, img: "redball.png" });
        e.setPhysics(1.0, 0.3, 0.6);
        e.setPath(new Path().to(7, 7).to(7, 1).to(7, 7), 2, true);
        e.setDamage(4);
        e.setOnDefeatHero(() => { endText = "Stay out of my way!"; });

        // our third enemy moves with tilt, which makes it hardest to avoid
        e = jl.world.makeEnemy({ x: 15, y: 1, width: .5, height: .5, img: "redball.png" });
        e.setPhysics(15, 0.3, 0.6);
        e.setMoveByTilting();
        e.setDamage(4);
        e.setOnDefeatHero(() => { endText = "You can't run away from me!"; });

        // be sure when testing this level to lose, with each enemy being the last the hero
        // collides with, so that you can see the different messages
        welcomeMessage(jl, "The hero can defeat up to two enemies...");
        winMessage(jl, "Great Job");
        jl.nav.setLoseSceneBuilder((overlay: OverlayApi) => {
            overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "black.png" }, (_hudx: number, _hudY: number) => {
                jl.nav.repeatLevel();
                return true;
            });
            overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => endText);
        });
    }

    // This level shows that we can win a level by defeating all enemies.  It also shows that
    // we can put a time limit on a level
    else if (index == 19) {
        // start with a hero who is controlled via Joystick
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        jl.hud.addJoystickControl({ x: 0, y: 7.5, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, false);

        // draw two enemies.  Remember, each does 2 units of damage
        jl.world.makeEnemy({ x: 6, y: 6, width: .5, height: .5, img: "redball.png" });
        jl.world.makeEnemy({ x: 15, y: 1, width: .5, height: .5, img: "redball.png" });

        // Give the hero enough strength to beat the enemies
        h.setStrength(5);

        // Start a countdown with 10 seconds, and put a timer on the HUD
        jl.score.setLoseCountdown(10);
        jl.hud.addText({ x: .1, y: 8.5, face: "Arial", color: "#000000", size: 32, z: 2 }, () => jl.score.getLoseCountdown().toFixed(0));

        // indicate that defeating all of the enemies is the way to win this level
        jl.score.setVictoryEnemyCount();

        welcomeMessage(jl, "You have 10 seconds to defeat the enemies");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // This level shows that a goodie can change the hero's strength, and that we can win by
    // defeating a specific number of enemies, instead of all enemies.
    else if (index == 20) {
        // start with a hero who is controlled via Joystick
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        jl.hud.addJoystickControl({ x: 0, y: 7.5, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, false);

        // draw an enemy.  It does 2 units of damage.  If it disappears, it will make a sound
        let e = jl.world.makeEnemy({ x: 10, y: 6, width: .5, height: .5, img: "redball.png" });
        e.setOnDefeated((_e: Enemy, _h?: WorldActor) => { jl.playSound("slowdown.ogg"); });

        // draw another enemy.  It is too deadly for us to ever defeat.
        let e2 = jl.world.makeEnemy({ x: 7, y: 7, width: 2, height: 2, img: "redball.png" });
        e2.setDamage(100);

        // this goodie gives an extra "2" units of strength:
        let g = jl.world.makeGoodie({ x: 14, y: 7, width: .5, height: .5, img: "blueball.png" });
        g.setCollectCallback((_g: Goodie, h: Hero) => { jl.playSound("woowoowoo.ogg"); h.setStrength(2 + h.getStrength()); });

        // Display the hero's strength
        jl.hud.addText({ x: .1, y: 8.5, face: "Arial", color: "#000000", size: 32, z: 2 }, () => h.getStrength() + " Strength");

        // win by defeating one enemy
        jl.score.setVictoryEnemyCount(1);

        // Change the text that appears on the scene when we win the level
        winMessage(jl, "Good enough...");
        loseMessage(jl, "Try Again");
        welcomeMessage(jl, "Collect blue balls to increase strength\n" + "Defeat one enemy to win");
    }

    // this level introduces the idea of invincibility. Collecting the goodie makes the hero
    // invincible for a little while...
    else if (index == 21) {
        // start with a hero who is controlled via Joystick
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        jl.hud.addJoystickControl({ x: 0, y: 7.5, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, false);

        // draw a few enemies, and make them rotate
        for (let i = 0; i < 5; ++i) {
            let e = jl.world.makeEnemy({ x: i + 4, y: 6, width: .5, height: .5, img: "redball.png" });
            e.setPhysics(1.0, 0.3, 0.6);
            e.setRotationSpeed(1);
        }

        // this goodie makes us invincible
        let g = jl.world.makeGoodie({ x: 15, y: 8, width: .5, height: .5, img: "blueball.png" });
        g.setCollectCallback((_g: Goodie, h: Hero) => { h.setInvincibleRemaining(h.getInvincibleRemaining() + 15); });
        g.setPath(new Path().to(15, 8).to(10, 3).to(15, 8), 5, true);
        g.setRotationSpeed(0.25);

        // we'll still say you win by reaching the Destination. Defeating
        // enemies is just for fun...
        let d = jl.world.makeDestination({ x: 15, y: 1, width: .75, height: .75, img: "mustardball.png" });
        d.setOnAttemptArrival(() => { return jl.score.getEnemiesDefeated() >= 5; });
        jl.score.setVictoryDestination(1);

        // display a goodie count for type-1 goodies
        jl.hud.addText({ x: .1, y: 8.5, face: "Arial", color: "#3C46FF", size: 12, z: 2 }, () => jl.score.getGoodies1() + " Goodies");

        jl.hud.addText({ x: .1, y: 7.5, face: "Arial", color: "#3C46FF", size: 12, z: 2 }, () => h.getInvincibleRemaining().toFixed(0) + " Invincibility");

        // put a frames-per-second display on the screen.
        jl.hud.addText({ x: .1, y: 8, face: "Arial", color: "#C8C864", size: 12, z: 2 }, () => jl.getFPS().toFixed(0) + " fps");

        welcomeMessage(jl, "The blue ball will make you invincible for 15 seconds");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // We can make goodies "count" for more than one point... they can even count for negative
    // points.
    else if (index == 22) {
        // start with a hero who is controlled via Joystick
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        jl.hud.addJoystickControl({ x: 0, y: 7.5, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, false);

        // Set up a destination that requires 7 type-1 goodies
        let d = jl.world.makeDestination({ x: 15, y: 1, width: .75, height: .75, img: "mustardball.png" });
        d.setOnAttemptArrival(() => { return jl.score.getGoodies1() >= 7; });
        jl.score.setVictoryDestination(1);

        // create some goodies with special scores. Note that we're still only dealing with
        // type-1 scores
        let g1 = jl.world.makeGoodie({ x: 9, y: 0, width: .5, height: .5, img: "blueball.png" });
        g1.setScore(-2, 0, 0, 0);
        let g2 = jl.world.makeGoodie({ x: 9, y: 6, width: .5, height: .5, img: "blueball.png" });
        g2.setScore(9, 0, 0, 0);

        // print a goodie count to show how the count goes up and down
        jl.hud.addText({ x: 7, y: 8.5, face: "Arial", color: "#3C46FF", size: 12, z: 2 }, () => "Your score is: " + jl.score.getGoodies1());

        welcomeMessage(jl, "Collect 'the right' blue balls to activate destination");
        winMessage(jl, "Great Job");
    }

    // this level demonstrates that we can drag entities (in this case, obstacles), and that we
    // can make rotated obstacles. The latter could be useful for having angled walls in a maze
    else if (index == 23) {
        // start with a hero who is controlled via tilt, and a destination
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        jl.world.enableTilt(10, 10);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();

        jl.world.makeDestination({ x: 15, y: 1, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // draw two obstacles that we can drag
        let o = jl.world.makeObstacle({ box: true, x: 5, y: 5, width: .75, height: .75, img: "purpleball.png" });
        o.setPhysics(0, 1, 0);
        o.setDraggable(true);
        let o2 = jl.world.makeObstacle({ box: true, x: 8, y: 5, width: .75, height: .75, img: "purpleball.png" });
        o2.setPhysics(0, 1, 0);
        o2.setDraggable(true);
        jl.hud.createDragZone({ x: 0, y: 0, width: 16, height: 9, img: "" });

        // draw an obstacle that is oblong (due to its width and height) and that is rotated.
        // Note that this should be a box, or it will not have the right underlying shape.
        o = jl.world.makeObstacle({ box: true, x: 3, y: 3, width: .75, height: .15, img: "purpleball.png" });
        o.setRotation(Math.PI / 4);

        welcomeMessage(jl, "More obstacle tricks, including one that can be dragged");
        winMessage(jl, "Great Job");
    }

    // This level shows how we can use "poking" to move obstacles. In this case, pressing an
    // obstacle selects it, and pressing the screen moves the obstacle to that location.
    // Double-tapping an obstacle removes it.
    else if (index == 24) {
        // start with a hero who is controlled via Joystick, and a destination
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);

        jl.world.makeDestination({ x: 15, y: 1, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // draw a picture on the -1 plane, so it is a background behind the hero and destination
        jl.world.drawPicture({ x: 0, y: 0, width: 16, height: 9, img: "noise.png", z: -1 });

        // make a few pokeable obstacles
        let o = jl.world.makeObstacle({ box: true, x: 14, y: 0, width: .25, height: 2, img: "purpleball.png" });
        o.setPhysics(0, 100, 0);
        o.setTapHandler(() => { jl.hud.setActiveActor(o); return true; })
        jl.hud.createPokeToPlaceZone({ x: 0, y: 0, width: 16, height: 9, img: "" });

        let o2 = jl.world.makeObstacle({ box: true, x: 14, y: 2, width: 2, height: .25, img: "purpleball.png" });
        o2.setPhysics(0, 100, 0);
        o2.setTapHandler(() => { jl.hud.setActiveActor(o2); return true; })

        // Note that we need to make the joystick *after* the pokeToPlaceZone,
        // or else our interaction with the zone will prevent the joystick from
        // working
        jl.hud.addJoystickControl({ x: 0, y: 7.5, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, false);

        welcomeMessage(jl, "Touch an obstacle to select it, then touch the " + "screen to move it\n (double-touch to remove)");
        winMessage(jl, "Great Job");
    }

    // In this level, the enemy chases the hero
    else if (index == 25) {
        // start with a hero who is controlled via Joystick, and a destination
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        jl.hud.addJoystickControl({ x: 0, y: 7.5, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, false);

        jl.world.makeDestination({ x: 14, y: 2, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // create an enemy who chases the hero
        let e3 = jl.world.makeEnemy({ x: 15, y: 1, width: .5, height: .5, img: "redball.png" });
        e3.setPhysics(.1, 0.3, 0.6);
        e3.setChaseSpeed(1, h, true, true);

        // draw a picture late within this block of code, but still cause the picture to be
        // drawn behind everything else by giving it a z index of -2
        jl.world.drawPicture({ x: 0, y: 0, width: 16, height: 9, img: "noise.png", z: -2 });

        // We can change the z-index of anything... let's move the enemy to -2. Since we do this
        // after drawing the picture, it will still be drawn on top of the background, but we
        // should also be able to see it go under the destination
        e3.setZIndex(-2);

        welcomeMessage(jl, "The enemy will chase you");
        winMessage(jl, "Good Job");
        loseMessage(jl, "Try Again");
    }

    // We can make obstacles play sounds either when we collide with them, or touch them
    else if (index == 26) {
        // start with a hero who is controlled via Joystick, and a destination
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        jl.hud.addJoystickControl({ x: 0, y: 7.5, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, false);

        jl.world.makeDestination({ x: 14, y: 2, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // set up our obstacle so that collision and touch make it play sounds
        let o = jl.world.makeObstacle({ x: 5, y: 5, width: .75, height: .75, img: "purpleball.png" });
        o.setPhysics(1, 0, 1);
        o.setTapHandler(() => { jl.playSound("lowpitch.ogg"); return true; });
        o.setHeroCollisionCallback(() => { jl.playSound("hipitch.ogg"); });

        welcomeMessage(jl, "Touch the purple ball or collide with it, and a " + "sound will play");
        winMessage(jl, "Great Job");
    }

    // This hero rotates so that it faces in the direction of movement. This can be useful in
    // games where the perspective is from overhead, and the hero is moving in any X or Y
    // direction
    else if (index == 27) {
        // set up a hero who rotates in the direction of movement, and is controlled by joystick
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "legstar1.png" });
        h.setPhysics(5, 0, 0.6);
        h.setRotationByDirection();
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, 0, 1);
        jl.hud.addJoystickControl({ x: 0, y: 7.5, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, false);

        // We won't add a destination... instead, the level will end in victory after 25 seconds
        jl.score.setWinCountdown(25);
        jl.hud.addText({ x: .1, y: 8.5, face: "Arial", color: "#000000", size: 32, z: 2 }, () => jl.score.getWinCountdown().toFixed(0));

        // Let's have an enemy, too
        jl.world.makeEnemy({ x: 7, y: 3.5, width: 2, height: 2, img: "redball.png" });

        welcomeMessage(jl, "The star rotates in the direction of movement");
        winMessage(jl, "You Survived!");
        loseMessage(jl, "Try Again");
    }

    // This level shows two things. The first is that a custom motion path can allow things to
    // violate the laws of physics and pass through other things. The second is that motion
    // paths can go off-screen.
    else if (index == 28) {
        // set up a hero who rotates in the direction of movement, and is controlled by joystick
        let h = jl.world.makeHero({ x: 8, y: 5.25, width: .75, height: .75, img: "legstar1.png" });
        h.setPhysics(5, 0, 0.6);
        h.setRotationByDirection();
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, 0, 1);
        jl.hud.addJoystickControl({ x: 0, y: 7.5, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, false);

        // destination is right below the hero
        jl.world.makeDestination({ x: 8, y: 1, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // this enemy starts from off-screen... you've got to be quick to survive!
        let e = jl.world.makeEnemy({ x: 4, y: -16, width: 8, height: 8, img: "redball.png" });
        e.setPath(new Path().to(4, -16).to(4, 0).to(4, -16), 6, true);

        welcomeMessage(jl, "Reach the destination to win the level.");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Ha Ha Ha");
    }

    // This level shows that we can draw on the screen to create obstacles.
    //
    // This is also our first exposure to "callbacks".  A "callback" is a way of providing code that runs in response to
    // some event.  We use a callback to customize the obstacles that are drawn to the screen in response to scribbles.
    else if (index == 29) {
        // Set up a hero and destination, and turn on tilt
        let h = jl.world.makeHero({ x: 8, y: 8, width: .75, height: .75, img: "legstar1.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, 0, 1);
        jl.world.enableTilt(10, 10);
        jl.world.makeDestination({ x: 8, y: 1, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // turn on 'scribble mode'... this says "draw a purple ball with a .25f radius at the
        // location where the scribble happened
        // It also says "when an obstacle is drawn, do some stuff to the
        // obstacle". 
        const width = .25;
        const height = .25;
        const img = "purpleball.png";
        let make = (hudX: number, hudY: number): boolean => {
            // Always convert the hud coordinates to world coordinates
            let pixels = jl.hud.overlayToWorldCoords(hudX, hudY);
            let o = jl.world.makeObstacle({ x: pixels.x - width / 2, y: pixels.y - height / 2, width: width, height: height, img: img });
            o.setPhysics(0, 2, 0);
            o.setDisappearDelay(10, true);
            return true;
        };
        jl.hud.addPanCallbackControl({ x: 0, y: 0, width: 16, height: 9, img: "" }, make, make, make);
        welcomeMessage(jl, "Draw on the screen\nto make obstacles appear");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // This level shows that we can "flick" things to move them. Notice that we do not enable
    // tilt. Instead, we specified that there is a default gravity in the Y dimension pushing
    // everything down. This is much like gravity on earth. The only way to move things, then,
    // is by flicking them.
    else if (index == 30) {
        // create a level with a constant force downward in the Y dimension
        jl.world.resetGravity(0, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        // draw a destination
        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // create a hero and obstacle, both of which can be flicked
        let h = jl.world.makeHero({ x: 1, y: 1, width: .75, height: .75, img: "legstar1.png" });
        h.setPhysics(5, 0, 0.6);
        h.setFlickable(1);
        jl.hud.createSwipeZone({ x: 0, y: 0, width: 16, height: 9, img: "" });
        h.disableRotation();
        let o = jl.world.makeObstacle({ x: 6, y: 6, width: .75, height: .75, img: "purpleball.png" });
        o.setPhysics(5, 0, 0.6);
        o.setFlickable(.5);

        welcomeMessage(jl, "Flick the hero to the destination");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // This level introduces a new concept: scrolling in the X dimension. We have
    // a constant force in the  Y direction, and now we say that tilt
    // can produce forces in X but not in Y. Thus we can tilt to move the hero left/right. Note,
    // too, that the hero will fall to the floor, since there is a constant downward force, but
    // there is not any mechanism to apply a Y force to make it move back up.
    else if (index == 31) {
        // make a long level but not a tall level, and provide a constant downward force:
        jl.world.setCameraBounds(3 * 16, 9);
        jl.world.resetGravity(0, 10);
        // turn on tilt, but only in the X dimension
        jl.world.enableTilt(10, 0);
        jl.world.drawBoundingBox(0, 0, 3 * 16, 9, "", 1, 0, 1);
        // Add a hero and destination
        let h = jl.world.makeHero({ x: .25, y: 8, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        jl.world.makeDestination({ x: 47, y: 8.25, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        jl.world.setCameraChase(h);

        welcomeMessage(jl, "Side scroller with tilt");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // In the previous level, it was hard to see that the hero was moving.  We can make a
    // background layer to remedy this situation. Notice that the background uses transparency
    // to show the blue color for part of the screen
    else if (index == 32) {
        // Start with a repeat of the previous level
        jl.world.setCameraBounds(128, 9);
        jl.world.resetGravity(0, 10);
        jl.world.enableTilt(10, 0);
        jl.world.drawBoundingBox(0, 0, 128, 9, "", 1, 0, 1);
        let h = jl.world.makeHero({ x: .25, y: 7.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        jl.world.makeDestination({ x: 127, y: 8.25, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        jl.world.setCameraChase(h);

        // Paint the background blue
        jl.world.setBackgroundColor(0x17B4FF);

        // put in a picture that auto-tiles, and that moves with velocity "0" relative to the
        // movement of the hero (on whom the camera focuses).  This will simply tile the
        // background.  Note that background layers don't work nicely with zoom.
        //
        // Note that background "layers" are all drawn *before* anything that is drawn with a
        // z index... so the background will be behind the hero
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "mid.png" }, 0);

        // make an obstacle that hovers in a fixed place. Note that hovering and zoom do not
        // work together nicely.
        let o = jl.world.makeObstacle({ x: 8, y: 1, width: 1, height: 1, img: "blueball.png" });
        o.setHover(8, 1);

        // Add a meter to show how far the hero has traveled
        jl.hud.addText({ x: .1, y: 8.5, face: "Arial", color: "#FF00FF", size: 16, z: 2 }, () => Math.floor(h.getXPosition()) + " m");

        // Add some text about the previous best score
        jl.world.addText({ x: .1, y: 8, face: "Arial", color: "#000000", size: 12, z: 0 }, () => "best: " + jl.score.getGameFact("HighScore32", "0") + "M");

        welcomeMessage(jl, "Side Scroller with basic repeating background");
        // when this level ends, we save the best score. Once the score is saved, it is saved
        // permanently on the phone. Note that we could run a callback on losing the level, too
        winMessage(jl, "Great Job", () => {
            // Get the hero distance at the end of the level... it's our score
            let score = Math.ceil(h.getXPosition());
            // We read the previous best score, which we saved as "HighScore32".  Remember
            // that "Game" facts never go away, even when we quit the game
            let oldBest = parseInt(jl.score.getGameFact("HighScore32", "0"));
            if (oldBest < score)
                // If our new score is higher, then save it
                jl.score.setGameFact("HighScore32", score + "");
        });
        loseMessage(jl, "Try Again");
    }

    // Now let's look at how to add multiple background layers.  Also, let's add jumping
    else if (index == 33) {
        // Our configuration is the same as the previous level
        jl.world.setCameraBounds(128, 9);
        jl.world.resetGravity(0, 10);
        jl.world.enableTilt(10, 0);
        jl.world.drawBoundingBox(0, 0, 128, 9, "", 1, 0, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        jl.world.makeDestination({ x: 127, y: 8.25, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        jl.world.setCameraChase(h);

        // this says that touching makes the hero jump
        h.setTouchToJump();
        // this is the force of a jump. remember that up is negative.
        h.setJumpImpulses(0, 10);
        // the sound to play when we jump
        h.setJumpSound("fwapfwap.ogg");

        // set up our background again, but add a few more layers
        jl.world.setBackgroundColor(0x17B4FF);

        // this layer has a scroll factor of 0... it won't move
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 0, width: 32, height: 9, img: "back.png" }, .5);
        // this layer moves at half the speed of the hero
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "mid.png" }, 0);
        // this layer has a negative value... it moves faster than the hero
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 1, width: 16, height: 2.8, img: "front.png" }, -.5);

        welcomeMessage(jl, "Press the hero to make it jump");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // In side-scrolling games, we can have the hero move at a fixed velocity, instead of
    // controlling its velocity with tilt or a joystick.
    else if (index == 34) {
        // default side-scroller setup.  Note that neither the hero nor the bounding box has
        // friction
        jl.world.setCameraBounds(128, 9);
        jl.world.resetGravity(0, 10);
        jl.world.enableTilt(10, 0);
        jl.world.drawBoundingBox(0, 0, 128, 9, "", 1, 0, 0);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0);
        h.setMoveByTilting();
        jl.world.makeDestination({ x: 124, y: 8.25, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        jl.world.setCameraChase(h);

        // prevent the hero from rotating, and give it fixed velocity
        h.disableRotation();
        h.addVelocity(5, 0);
        // center the camera a little ahead of the hero, so we can see more of the world during
        // gameplay
        h.setCameraOffset(6, 0);
        jl.world.setCameraChase(h);
        // set up support for jumping, and add a button that covers the whole screen
        h.setJumpImpulses(0, 10);
        jl.hud.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "" }, jl.hud.jumpAction(h, 0));
        // set up the backgrounds
        jl.world.setBackgroundColor(0x17B4FF);
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "mid.png" }, 0);

        // if the hero jumps over the destination, we have a problem. To fix
        // it, let's put an invisible enemy right after the destination, so
        // that if the hero misses the destination, it hits the enemy and we
        // can start over. Of course, we could just do the destination like
        // this instead, but this is more fun...
        jl.world.makeEnemy({ x: 127, y: 0, width: .5, height: 9, img: "" });

        welcomeMessage(jl, "Press anywhere to jump");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // the default is that once a hero jumps, it can't jump again until it touches an obstacle
    // (floor or wall). Here, we enable multiple jumps. Coupled with a small jump impulse, this
    // makes jumping feel more like swimming or controlling a helicopter.
    else if (index == 35) {
        // Note: we can go above the trees
        jl.world.setCameraBounds(64, 15);
        jl.world.resetGravity(0, 10);
        jl.world.drawBoundingBox(0, 0, 64, 15, "", 1, 0, 0);
        let h = jl.world.makeHero({ box: true, x: .25, y: 10, width: .75, height: .75, img: "greenball.png" });
        h.disableRotation();
        h.setPhysics(1, 0, 0);
        h.addVelocity(2, 0);
        jl.world.setCameraChase(h);
        h.setCameraOffset(6, 0);
        jl.world.setBackgroundColor(0x17B4FF);
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 6, width: 16, height: 9, img: "mid.png" }, 0);
        // the hero now has multijump, with small jumps:
        h.setMultiJumpOn();
        h.setJumpImpulses(0, 5);

        // Now we'll say that the destination is as high as the screen, so reaching the end
        // means victory
        jl.hud.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "" }, jl.hud.jumpAction(h, 0));
        jl.world.makeDestination({ x: 63.5, y: 0, width: .5, height: 15, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // Draw some random scattered enemies.  They'll be between 10 and 60 in X, and between
        // 0 and 14 in the Y
        for (let i = 0; i < 30; ++i) {
            jl.world.makeEnemy({ x: 10 + jl.getRandom(50), y: jl.getRandom(14), width: .5, height: .5, img: "redball.png" });
        }

        welcomeMessage(jl, "Multi-jump is enabled");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // This level shows that we can make a hero move based on how we touch the screen
    else if (index == 36) {
        jl.world.setCameraBounds(48, 9);
        jl.world.drawBoundingBox(0, 0, 48, 9, "", 1, 0, 1);
        let h = jl.world.makeHero({ x: 0, y: 0, width: .75, height: .75, img: "legstar1.png" });
        h.disableRotation();
        h.setPhysics(5, 0, 0.6);
        jl.world.setCameraChase(h);
        jl.world.makeDestination({ x: 47, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        jl.world.setBackgroundColor(0x17B4FF);
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "mid.png" }, 0);

        // this is a bit of a hack for letting the hero flip its image when it moves backward.
        // It will make more sense once we get to the levels that demonstrate animation
        h.setDefaultAnimation(jl.makeAnimation(200, true, ["legstar1.png", "legstar1.png"]));
        h.setDefaultReverseAnimation(jl.makeAnimation(200, true, ["fliplegstar1.png", "fliplegstar1.png"]));

        // let's draw an enemy, just in case anyone wants to try to go to the top left corner
        jl.world.makeEnemy({ x: 0, y: 8, width: 1, height: 1, img: "redball.png" });

        // draw some buttons for moving the hero
        jl.hud.addToggleButton({ x: 0, y: 2, width: 2, height: 5, img: "" }, jl.hud.makeXMotionAction(h, -5), jl.hud.makeXMotionAction(h, 0));
        jl.hud.addToggleButton({ x: 14, y: 2, width: 2, height: 5, img: "" }, jl.hud.makeXMotionAction(h, 5), jl.hud.makeXMotionAction(h, 0));
        jl.hud.addToggleButton({ x: 2, y: 7, width: 12, height: 2, img: "" }, jl.hud.makeYMotionAction(h, 5), jl.hud.makeYMotionAction(h, 0));
        jl.hud.addToggleButton({ x: 2, y: 0, width: 12, height: 2, img: "" }, jl.hud.makeYMotionAction(h, -5), jl.hud.makeYMotionAction(h, 0));

        welcomeMessage(jl, "Press screen borders to move the hero");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // In the last level, we had complete control of the hero's movement.  Here, we give the
    // hero a fixed velocity, and only control its up/down movement.
    else if (index == 37) {
        jl.world.setCameraBounds(48, 9);
        jl.world.drawBoundingBox(0, 0, 48, 9, "", 1, 0, 0);
        jl.world.makeDestination({ x: 47, y: 8, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        jl.world.setBackgroundColor(0x17B4FF);
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "mid.png" }, 0);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.disableRotation();
        h.setPhysics(5, 0, 0);
        h.addVelocity(5, 0);
        jl.world.setCameraChase(h);

        // draw an enemy to avoid, and one at the end
        jl.world.makeEnemy({ x: 30, y: 6, width: 1, height: 1, img: "redball.png" });
        jl.world.makeEnemy({ x: 47.9, y: 0, width: .1, height: 9, img: "" });

        // draw the up/down controls
        jl.hud.addToggleButton({ x: 0, y: 0, width: 16, height: 4.5, img: "" }, jl.hud.makeYMotionAction(h, -5), jl.hud.makeYMotionAction(h, 0));
        jl.hud.addToggleButton({ x: 0, y: 4.5, width: 16, height: 4.5, img: "" }, jl.hud.makeYMotionAction(h, 5), jl.hud.makeYMotionAction(h, 0));

        welcomeMessage(jl, "Press screen borders\nto move up and down");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // this level demonstrates crawling heroes. We can use this to simulate crawling, ducking,
    // rolling, spinning, etc. Note, too, that we can use it to make the hero defeat certain
    // enemies via crawl.
    else if (index == 38) {
        jl.world.setCameraBounds(48, 9);
        jl.world.resetGravity(0, 10);
        jl.world.drawBoundingBox(0, 0, 48, 9, "", 1, .3, 0);
        jl.world.makeDestination({ x: 47, y: 8, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        let h = jl.world.makeHero({ box: true, x: 0, y: 7, width: .75, height: 1.5, img: "greenball.png" });
        h.setPhysics(5, 0, 0);
        h.addVelocity(5, 0);
        jl.world.setCameraChase(h);
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "mid.png" }, 0);

        // to enable crawling, we just draw a crawl button on the screen
        // Note that the third parameter means that the hero body will rotate +90 degrees when
        // it is crawling.
        jl.hud.addToggleButton({ x: 0, y: 0, width: 16, height: 9, img: "" }, jl.hud.makeCrawlToggle(h, true, Math.PI / 2), jl.hud.makeCrawlToggle(h, false, Math.PI / 2));

        // make an enemy who we can defeat by colliding with it while crawling
        let e = jl.world.makeEnemy({ x: 40, y: 8, width: 1, height: 1, img: "redball.png" });
        e.setDefeatByCrawl();

        welcomeMessage(jl, "Press the screen\nto crawl");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // We can make a hero start moving only when it is pressed. This can even let the hero hover
    // until it is pressed. We could also use this to have a game where the player puts
    // obstacles in place, then starts the hero moving.
    else if (index == 39) {
        jl.world.resetGravity(0, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, 0, 0);
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "mid.png" }, 0);
        jl.world.makeDestination({ x: 15, y: 8, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // make a hero who doesn't start moving until it is touched
        let h = jl.world.makeHero({ box: true, x: 0, y: 8.25, width: .75, height: .75, img: "greenball.png" });
        h.disableRotation();
        h.setPhysics(1, 0, 0);
        h.setTouchAndGo(5, 0);
        jl.world.setCameraChase(h);

        welcomeMessage(jl, "Press the hero to start moving");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // This level is just a placeholder for now... there's nothing new or
    // interesting here
    else if (index == 40) {
        // We'll use tilt and jump to control the hero in this level
        jl.world.setCameraBounds(34, 9);
        jl.world.resetGravity(0, 10);
        jl.world.enableTilt(10, 0);
        jl.world.setTiltAsVelocity(true);
        jl.world.drawBoundingBox(0, 0, 34, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setJumpImpulses(0, 20);
        h.setTouchToJump();
        h.setMoveByTilting();
        jl.world.setCameraChase(h);
        jl.world.makeDestination({ x: 33, y: 8, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        welcomeMessage(jl, "There's nothing interesting in this level.  Sorry.");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // In a side-scrolling game, it is useful to be able to change the hero's speed either
    // permanently or temporarily. In JetLag, we can use a collision between a hero and an
    // obstacle to achieve this effect.
    else if (index == 41) {
        jl.world.setCameraBounds(160, 9);
        jl.world.drawBoundingBox(0, 0, 160, 9, "", 1, 0, 1);
        let h = jl.world.makeHero({ x: 0, y: 0, width: .75, height: .75, img: "greenball.png" });
        h.disableRotation();
        h.setPhysics(5, 0, 0.6);
        h.addVelocity(5, 0);
        jl.world.setCameraChase(h);
        jl.world.makeDestination({ x: 159, y: 0, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        jl.world.setBackgroundColor(0x17B4FF);
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "mid.png" }, 0);

        // place a speed-up obstacle that lasts for 2 seconds
        let o1 = jl.world.makeObstacle({ x: 20, y: 0, width: 1, height: 1, img: "rightarrow.png" });
        o1.setSpeedBoost(5, 0, 2);
        // place a slow-down obstacle that lasts for 3 seconds
        let o2 = jl.world.makeObstacle({ x: 60, y: 0, width: 1, height: 1, img: "leftarrow.png" });
        o2.setSpeedBoost(-2, 0, 3);
        // place a permanent +3 speedup obstacle... the -1 means "forever"
        let o3 = jl.world.makeObstacle({ x: 80, y: 0, width: 1, height: 1, img: "purpleball.png" });
        o3.setSpeedBoost(3, 0, -1);

        welcomeMessage(jl, "Speed boosters and reducers");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // this level only exists to show that backgrounds can scroll vertically.
    else if (index == 42) {
        // set up a level where tilt only makes the hero move up and down
        jl.world.setCameraBounds(16, 36);
        jl.world.enableTilt(0, 10);
        jl.world.drawBoundingBox(0, 0, 16, 36, "", 1, 0, 1);
        let h = jl.world.makeHero({ x: 2, y: 1, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        jl.world.setCameraChase(h);

        // Win by reaching the bottom
        jl.world.makeDestination({ x: 0, y: 35, width: 16, height: 1, img: "red.png" });
        jl.score.setVictoryDestination(1);

        // set up vertical scrolling backgrounds
        jl.world.setBackgroundColor(0xFF00FF);
        jl.world.addVerticalBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "back.png" }, 1);
        jl.world.addVerticalBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "mid.png" }, 0);
        jl.world.addVerticalBackgroundLayer({ x: 0, y: 5, width: 16, height: 2.8, img: "front.png" }, .5);

        welcomeMessage(jl, "Vertical scroller demo");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // The next few levels demonstrate support for throwing projectiles. In this level, we throw
    // projectiles by touching the hero, and the projectile always goes in the same direction
    else if (index == 43) {
        jl.world.enableTilt(10, 10);
        // Just for fun, we'll have an auto-scrolling background, to make it look like we're
        // moving all the time
        jl.world.addHorizontalAutoBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "mid.png" }, -5);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        // When this hero is touched, a projectile will fly straight up out of its top
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .8, height: .8, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setTouchToThrow(h, .4, 0, 10, 0);
        h.setMoveByTilting();

        // This enemy will slowly move toward the hero
        let e = jl.world.makeEnemy({ x: 15, y: 8, width: .75, height: .75, img: "redball.png" });
        e.setChaseFixedMagnitude(h, .1, .1, false, false);
        jl.score.setVictoryEnemyCount(1);

        // configure a pool of projectiles. We say that there can be no more
        // than 3 projectiles in flight at any time.
        jl.projectiles.configure(3, .25, .25, "greyball.png", 1, 0, true);

        welcomeMessage(jl, "Press the hero to make it throw projectiles");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // This is another demo of how throwing projectiles works. In this level, we limit the
    // distance that projectiles travel, and that we can put a control on the HUD for throwing
    // projectiles in two directions
    else if (index == 44) {
        // Set up a scrolling background for the level
        jl.world.addVerticalAutoBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "front.png" }, -5);
        jl.world.enableTilt(1, 0);
        jl.world.setTiltAsVelocity(true);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: 7.5, y: 0, width: 1, height: 1, img: "greenball.png" });
        h.disableRotation();
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        // Win by defeating all enemies
        jl.score.setVictoryEnemyCount();

        // draw two enemies, on either side of the screen
        let e1 = jl.world.makeEnemy({ x: 0, y: 0, width: .5, height: 9, img: "redball.png" });
        e1.setDamage(10);
        let e2 = jl.world.makeEnemy({ x: 15.5, y: 0, width: .5, height: 9, img: "redball.png" });
        e2.setDamage(10);
        // set up a pool of projectiles, but now once the projectiles travel more than 5 meters,
        // they disappear
        jl.projectiles.configure(100, .25, .25, "greyball.png", 1, 0, true);
        jl.projectiles.setRange(5);

        // Add buttons for throwing to the left and right.  Each keeps throwing for as long as
        // it is held, but only throws once every 100 milliseconds
        jl.hud.addToggleButton({ x: 0, y: 0, width: 8, height: 9, img: "" }, jl.hud.makeRepeatThrow(h, 100, 0, 1, -30, 0), undefined);
        jl.hud.addToggleButton({ x: 8, y: 0, width: 8, height: 9, img: "" }, jl.hud.makeRepeatThrow(h, 100, 1, 1, 30, 0), undefined);

        welcomeMessage(jl, "Press left and right to throw projectiles");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // this level shows how to change the amount of damage a projectile can do
    else if (index == 45) {
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: 0, y: 0, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(1, 0, 0.6);
        h.setMoveByTilting();
        jl.score.setVictoryEnemyCount();

        // draw a few enemies.  The damage of an enemy determines how many projectiles are
        // needed to defeat it
        for (let i = 1; i <= 6; i++) {
            let e = jl.world.makeEnemy({ x: 2 * i, y: 7 - i, width: 1, height: 1, img: "redball.png" });
            e.setPhysics(1.0, 0.3, 0.6);
            e.setDamage(2 * i);
        }

        // set up our projectiles... note that now projectiles each do 2 units of damage
        jl.projectiles.configure(3, .4, .1, "greyball.png", 2, 0, true);
        // this button only throws one projectile per press...
        jl.hud.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "" }, jl.hud.ThrowFixedAction(h, .38, 0, 0, -10));

        welcomeMessage(jl, "Defeat all enemies to win");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // This level shows how to throw projectiles in a variety of directions, based on touch.
    // The velocity of the projectile will depend on the distance between the hero and the
    // touch point
    else if (index == 46) {
        jl.world.resetGravity(0, 3);
        // Note: the height of the bounding box is set so that enemies can be drawn off screen
        // and then fall downward
        jl.world.drawBoundingBox(0, -2, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: 8, y: 0, width: 1, height: 1, img: "greenball.png" });
        jl.score.setVictoryEnemyCount(20);

        // Draw a button for throwing projectiles in many directions.  Again, note that if we
        // hold the button, it keeps throwing
        jl.hud.addDirectionalThrowButton({ x: 0, y: 0, width: 16, height: 9, img: "" }, h, 50, .5, 0);

        // Set up our pool of projectiles.  With this throwing mechanism, the farther from the
        // hero we press, the faster the projectile goes, so we multiply the velocity by .8 to
        // slow it down a bit
        jl.projectiles.configure(100, .25, .25, "greyball.png", 2, 0, true);
        jl.projectiles.setMultiplier(.8);
        jl.projectiles.setRange(10);

        // We'll set up a timer, so that enemies keep falling from the sky
        jl.addTimer(1, true, () => {
            // get a random number between 0.0 and 15.0
            let x = jl.getRandom(151);
            x = x / 10;
            let e = jl.world.makeEnemy({ x: x, y: -1, width: 1, height: 1, img: "redball.png" });
            e.setCanFall();
        });

        welcomeMessage(jl, "Press anywhere to throw a ball");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // Continuing our exploration of projectiles, this level shows how projectiles can be
    // affected by gravity.  It also shows that projectiles do not have to disappear when they
    // collide with obstacles.
    else if (index == 47) {
        // In this level, there is no way to move the hero left and right, but it can jump
        jl.world.resetGravity(0, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: 0, y: 0, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 1);
        h.setJumpImpulses(0, -10);
        h.setTouchToJump();

        // draw a bucket, as three rectangles
        let leftBucket = jl.world.makeObstacle({ box: true, x: 9, y: 4, width: .1, height: 1, img: "red.png" });
        let rightBucket = jl.world.makeObstacle({ box: true, x: 10, y: 4, width: .1, height: 1, img: "red.png" });
        let bottomBucket = jl.world.makeObstacle({ box: true, x: 9, y: 4.9, width: 1.1, height: .1, img: "red.png" });

        // Place an enemy in the bucket, and require that it be defeated
        let e = jl.world.makeEnemy({ x: 9.2, y: 4.2, width: .75, height: .75, img: "redball.png" });
        e.setCanFall();
        e.setDamage(4);
        jl.score.setVictoryEnemyCount();

        // cover "most" of the screen with a button for throwing projectiles.  This ensures that
        // we can still tap the hero to make it jump
        jl.hud.addTapControl({ x: 1, y: 0, width: 15, height: 9, img: "" }, jl.hud.ThrowDirectionalAction(h, .5, 0));
        // Set up a projectile pool with 5 projectiles
        jl.projectiles.configure(5, .5, .5, "greyball.png", 1, 0, true);
        // Make the projectiles move a little faster
        jl.projectiles.setMultiplier(2);
        // Projectiles are affected by gravity
        jl.projectiles.setGravityOn();
        // projectiles do not "pass through" other things
        jl.projectiles.enableCollisions();
        // Projectiles can collide with each other without disappearing
        jl.projectiles.setCollisionOk();

        // We want to make it so that when the ball hits the obstacle (the backboard), it
        // doesn't disappear. The only time a projectile does not disappear when hitting an
        // obstacle is when you provide custom code to run on a projectile/obstacle collision.
        // In that case, you are responsible for removing the projectile (or for not removing
        // it).  That being the case, we can set a "callback" to run custom code when the
        // projectile and obstacle collide, and then just have the custom code do nothing.
        leftBucket.setProjectileCollisionCallback(() => { });

        // we can make a CollisionCallback object, and connect it to several obstacles
        let c = () => { };
        rightBucket.setProjectileCollisionCallback(c);
        bottomBucket.setProjectileCollisionCallback(c);

        // put a hint on the screen after 15 seconds to show where to click to ensure that
        // projectiles hit the enemy
        jl.addTimer(15, false, () => {
            let hint = jl.world.makeObstacle({ x: 3, y: 2.5, width: .2, height: .2, img: "purpleball.png" });
            // Make sure that when projectiles hit the obstacle, nothing happens
            hint.setCollisionsEnabled(false);
        });

        welcomeMessage(jl, "Press anywhere to throw a projectile");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // This level shows how we can employ a timer with an enemy. When the
    // timer runs out, if the enemy is still visible, then some custom code
    // will run. We can use this to simulate cancer cells or fire on a
    // building.
    else if (index == 48) {
        // In this level, we can press the screen to move left and right
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: .25, y: .25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);

        // Touching will throw a projectile upward
        jl.projectiles.configure(100, .5, .5, "greyball.png", 1, 0, true);

        h.setTouchToThrow(h, .12, .75, 0, 10);
        jl.hud.addToggleButton({ x: 0, y: 0, width: 2, height: 9, img: "" }, jl.hud.makeXMotionAction(h, -5), jl.hud.makeXMotionAction(h, 0));
        jl.hud.addToggleButton({ x: 14, y: 0, width: 2, height: 9, img: "" }, jl.hud.makeXMotionAction(h, 5), jl.hud.makeXMotionAction(h, 0));

        // sounds for when the projectile is thrown, and when it disappears
        jl.projectiles.setThrowSound("fwapfwap.ogg");
        jl.projectiles.setDisappearSound("slowdown.ogg");

        // draw an enemy that makes a sound when it disappears
        let e = jl.world.makeEnemy({ x: 8, y: 4, width: .5, height: .5, img: "redball.png" });
        e.setOnDefeated((_e: Enemy, _a?: WorldActor) => jl.playSound("lowpitch.ogg"));

        // This variable is part of the callback, so we can access it from our go() method
        let counter = 0.5;

        // Run some code every two seconds
        jl.addTimer(2, true, () => {
            // only reproduce the enemy if it is visible, and the new enemy will be on-screen
            if (e.getEnabled() && counter < 5) {
                // Figure out the Y position for enemies we make in this round
                let y = e.getYPosition() + counter;
                // make an enemy to the left and up
                let left = jl.world.makeEnemy({
                    x: e.getXPosition() - counter,
                    y: y, width: .5, height: .5, img: "redball.png"
                });
                left.setOnDefeated((_e: Enemy, _a?: WorldActor) => jl.playSound("lowpitch.ogg"));
                // make an enemy to the right and up
                let right = jl.world.makeEnemy({
                    x: e.getXPosition() + counter,
                    y: y, width: .5, height: .5, img: "redball.png"
                });
                right.setOnDefeated((_e: Enemy, _a?: WorldActor) => jl.playSound("lowpitch.ogg"));
                counter += 1;
            }
        });

        // win by defeating all the enemies
        jl.score.setVictoryEnemyCount();

        // put a count of defeated enemies on the screen
        jl.hud.addText({ x: .1, y: 8.5, face: "Arial", color: "#000000", size: 32, z: 2 }, () => jl.score.getEnemiesDefeated() + " Enemies Defeated");

        welcomeMessage(jl, "Throw balls at the enemies before they reproduce");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // This level shows that we can have moveable enemies that reproduce. Be careful... it is
    // possible to make a lot of enemies, really quickly
    else if (index == 49) {
        // Using tilt to control both the hero and the enemies makes this level really hard!
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        // Reach the destination to win
        jl.world.makeDestination({ x: 10, y: 8, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // make our initial enemy
        let e = jl.world.makeEnemy({ x: 14, y: 7, width: .5, height: .5, img: "redball.png" });
        e.setPhysics(5, 0.3, 0.6);
        e.setMoveByTilting();

        // We can use this array to store all of the enemies in the level
        let enemies: Enemy[] = [];
        enemies.push(e);

        // Attach the number "6" to the enemy, so that we can use it as a countdown for the
        // number of remaining duplications of this enemy.  Each enemy we make will have its own
        // counter.
        e.setExtra(6);

        // set a timer callback on the level, to repeatedly spawn new enemies.
        // warning: "6" is going to lead to lots of enemies eventually, and there's no
        // way to defeat them in this level!
        jl.addTimer(2, true, () => {
            // We will need to keep track of all the enemies we make, and then add them to
            // our list of enemies just before this function returns
            //
            // Note: it's a bad idea to make an array on every timer call, but for this
            // demo, it's OK
            let newEnemies: Enemy[] = [];

            // For each enemy we've made, if it has remaining reproductions, then make
            // another enemy
            for (let e of enemies) {
                // If this enemy has remaining reproductions
                if (e.getExtra() > 0) {
                    // decrease remaining reproductions
                    e.setExtra(e.getExtra() - 1);

                    // reproduce the enemy
                    let e2 = jl.world.makeEnemy({
                        x: e.getXPosition() + .01, y: e.getYPosition() + .01,
                        width: e.getWidth(), height: e.getHeight(), img: "redball.png"
                    });
                    e2.setPhysics(5, 0.3, 0.6);
                    e2.setMoveByTilting();

                    // set the new enemy's reproductions, save it
                    e2.setExtra(e.getExtra());
                    newEnemies.push(e2);
                }
            }
            // Add the new enemies to the main list
            let tmp = enemies.concat(newEnemies);
            enemies = tmp;
        });

        welcomeMessage(jl, "These enemies are really tricky");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // this level shows simple animation. Every entity can have a default animation.
    else if (index == 50) {
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        // this hero will be animated:
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "legstar1.png" });
        h.setPhysics(5, 0, 0.6);
        jl.hud.addJoystickControl({ x: 0, y: 7.5, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, true);


        // This says that we spend 200 milliseconds on each of the images that are listed, and
        // then we repeat
        h.setDefaultAnimation(jl.makeAnimation(200, true, ["legstar1.png", "legstar2.png", "legstar3.png", "legstar4.png"]));

        welcomeMessage(jl, "The hero is animated");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // This level introduces jumping animations and disappearance animations
    else if (index == 51) {
        // In this level, we will have tilt to move left/right, but there is so much
        // friction that tilt will only be effective when the hero is in the air
        jl.world.resetGravity(0, 10);
        jl.world.enableTilt(10, 0);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, 0, 1);

        jl.world.setBackgroundColor(0x17B4FF);
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "mid.png" }, 0);

        // The hero must reach this destination
        jl.world.makeDestination({ x: 15, y: 8, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // The hero has one animation when it is not in the air, another when it is
        let h = jl.world.makeHero({ x: .25, y: 7, width: .75, height: .75, img: "legstar1.png" });
        h.disableRotation();
        h.setPhysics(5, 0, 0.6);
        h.setJumpImpulses(0, 5);
        h.setTouchToJump();
        h.setMoveByTilting();

        // this is the more complex form of animation... we show the
        // different cells for different lengths of time
        h.setDefaultAnimation(jl.makeComplexAnimation(true).to("legstar1.png", 150).to("legstar2.png", 200).to("legstar3.png", 300).to("legstar4.png", 350));
        // we can use the complex form to express the simpler animation, of course
        h.setJumpAnimation(jl.makeComplexAnimation(true).to("legstar4.png", 200).to("legstar6.png", 200).to("legstar7.png", 200).to("legstar8.png", 200));

        // create a goodie that has a disappearance animation. When the
        // goodie is ready to disappear, we'll remove it, and then we'll run
        // the disappear animation. That means that we can make it have any
        // size we want, but we need to offset it from the (defunct)
        // goodie's position. Note, too, that the final cell is blank, so
        // that we don't leave a residue on the screen.
        let g = jl.world.makeGoodie({ x: 2, y: 7.5, width: .5, height: .5, img: "starburst3.png" });
        g.setDisappearAnimation(jl.makeComplexAnimation(false).to("starburst3.png", 200).to("starburst2.png", 200).to("starburst1.png", 200).to("starburst4.png", 200), 0, 0, .5, .5);

        welcomeMessage(jl, "Press the hero to make it jump");
        winMessage(jl, "Great Job");
    }

    // this level shows that projectiles can be animated, and that we can
    // animate the hero while it throws a projectile
    else if (index == 52) {
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // set up our hero
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "colorstar1.png" });
        h.setPhysics(5, 0, 0.6);
        h.setTouchToThrow(h, .375, .375, 0, -3);
        h.setMoveByTilting();

        // set up an animation when the hero throws:
        h.setThrowAnimation(jl.makeComplexAnimation(false).to("colorstar4.png", 100).to("colorstar5.png", 500));

        // make a projectile pool and give an animation pattern for the projectiles
        jl.projectiles.configure(100, .5, .5, "flystar1.png", 1, 0, true);
        jl.projectiles.setAnimation(jl.makeAnimation(100, true, ["flystar1.png", "flystar2.png"]));

        welcomeMessage(jl, "Press the hero to make it throw a ball");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // This level explores invincibility animation. While we're at it, we
    // make some enemies that aren't affected by invincibility, and some
    // that can even damage the hero while it is invincible.
    else if (index == 53) {
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        jl.world.makeDestination({ x: 15, y: 1, width: .5, height: .5, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // make an animated hero, and give it an invincibility animation
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "colorstar1.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        h.setDefaultAnimation(jl.makeComplexAnimation(true).to("colorstar1.png", 300).to("colorstar2.png", 300).to("colorstar3.png", 300).to("colorstar4.png", 300));
        h.setInvincibleAnimation(jl.makeComplexAnimation(true).to("colorstar5.png", 100).to("colorstar6.png", 100).to("colorstar7.png", 100).to("colorstar8.png", 100));

        // make some enemies
        for (let i = 0; i < 5; ++i) {
            let e = jl.world.makeEnemy({ x: 2 * i + 1, y: 7, width: .75, height: .75, img: "redball.png" });
            e.setPhysics(1.0, 0.3, 0.6);
            e.setRotationSpeed(1);
            e.setDamage(4);
            e.setOnDefeated((_e: Enemy, _a?: WorldActor) => jl.playSound("hipitch.ogg"));

            // The first enemy we create will harm the hero even if the hero is invincible
            if (i == 0)
                e.setImmuneToInvincibility();
            // the second enemy will not be harmed by invincibility, but won't harm an
            // invincible hero
            if (i == 1)
                e.setResistInvincibility();
        }
        // neat trick: this enemy does zero damage, but slows the hero down.
        let e = jl.world.makeEnemy({ x: 12, y: 7, width: .75, height: .75, img: "redball.png" });
        e.setPhysics(10, 0.3, 0.6);
        e.setMoveByTilting();
        e.setDamage(0);

        // add a goodie that makes the hero invincible
        let g = jl.world.makeGoodie({ x: 15, y: 7, width: .5, height: .5, img: "blueball.png" });
        g.setCollectCallback((_g: Goodie, h: Hero) => { h.setInvincibleRemaining(h.getInvincibleRemaining() + 15); });
        g.setPath(new Path().to(15, 7).to(5, 2).to(15, 7), 1, true);
        g.setRotationSpeed(0.25);
        jl.hud.addText({ x: .1, y: 8.5, face: "Arial", color: "#3C46FF", size: 12, z: 2 }, () => jl.score.getGoodies1() + " Goodies");

        // draw a picture when the level is won, and don't print text...
        // this particular picture isn't very useful
        jl.nav.setWinSceneBuilder((overlay: OverlayApi) => {
            overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "fade.png" }, (_hudx: number, _hudY: number) => {
                jl.nav.nextLevel();
                return true;
            });
        });
        welcomeMessage(jl, "The blue ball will make you invincible for 15 seconds");
        loseMessage(jl, "Try Again");
    }

    // demonstrate crawl animation, and also show that on multitouch phones, we can "crawl" in
    // the air while jumping.
    else if (index == 54) {
        jl.world.resetGravity(0, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 0);

        jl.world.makeDestination({ x: 15, y: 8.5, width: .5, height: .5, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // make a hero with fixed velocity, and give it crawl and jump
        // animations
        let h = jl.world.makeHero({ box: true, x: 0, y: 8, width: .75, height: .75, img: "legstar1.png" });
        h.setPhysics(5, 0, 0);
        h.addVelocity(2, 0);
        h.setCrawlAnimation(jl.makeComplexAnimation(true).to("legstar1.png", 100).to("legstar2.png", 300).to("legstar3.png", 300).to("legstar4.png", 100));
        h.setJumpAnimation(jl.makeComplexAnimation(true).to("legstar5.png", 200).to("legstar6.png", 200).to("legstar7.png", 200).to("legstar8.png", 200));
        jl.world.setCameraChase(h);

        // enable hero jumping and crawling
        h.setJumpImpulses(0, -8);
        jl.hud.addTapControl({ x: 0, y: 0, width: 8, height: 9, img: "" }, jl.hud.jumpAction(h, 0));
        jl.hud.addToggleButton({ x: 8, y: 0, width: 8, height: 9, img: "" }, jl.hud.makeCrawlToggle(h, true, Math.PI / 2), jl.hud.makeCrawlToggle(h, false, Math.PI / 2));

        // add an enemy we can defeat via crawling, just for fun. It should
        // be defeated even by a "jump crawl"
        let e = jl.world.makeEnemy({ x: 13, y: 4, width: 1, height: 5, img: "redball.png" });
        e.setPhysics(5, 0.3, 0.6);
        e.setDefeatByCrawl();

        // include a picture on the "try again" screen
        jl.nav.setLoseSceneBuilder((overlay: OverlayApi) => {
            overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "fade.png" }, (_hudx: number, _hudY: number) => {
                jl.nav.repeatLevel();
                return true;
            });
            overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => "Oh well...");
        });

        welcomeMessage(jl, "Press the right side of the screen to crawl or the left side to jump.");
        winMessage(jl, "Great Job");
    }

    // This isn't quite the same as animation.  We can indicate that a hero's image changes
    // depending on its strength. This can, for example, allow a hero to change (e.g., get
    // healthier) by swapping through images as goodies are collected, or allow the hero to
    // switch its animation depending on how many enemies it has collided with.
    else if (index == 55) {
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        // create 7 goodies, each of which adds 1 to the hero's strength
        for (let i = 0; i < 7; ++i) {
            let g = jl.world.makeGoodie({ x: 1 + i, y: 1 + i, width: .5, height: .5, img: "blueball.png" });
            g.setCollectCallback((_g: Goodie, h: Hero) => { h.setStrength(1 + h.getStrength()) });
        }

        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // make 8 enemies, each with strength == 1, so we can test moving our strength all the
        // way up to 8 and back down again
        for (let i = 0; i < 8; ++i) {
            let e = jl.world.makeEnemy({ x: 2 + i, y: 1 + i, width: .5, height: .5, img: "redball.png" });
            e.setDamage(1);
        }

        let h = jl.world.makeHero({ x: 0, y: 0, width: .75, height: .75, img: "colorstar1.png" });
        h.setPhysics(5, 0, 0.6);
        jl.hud.addJoystickControl({ x: 0, y: 7.5, width: 1.5, height: 1.5, img: "greyball.png" }, h, 5, true);

        // provide some code to run when the hero's strength changes
        h.setStrengthChangeCallback((actor: Hero) => {
            // get the hero's strength. Since the hero isn't dead, the
            // strength is at least 1. Since there are 7 strength
            // booster goodies, the strength is at most 8.
            let s = actor.getStrength();
            // set the hero's image according to the strength
            actor.setImage("colorstar" + s + ".png");
        });
    }

    // We can use obstacles to defeat enemies, and we can control which enemies the obstacle
    // can defeat, by using obstacle-enemy collision callbacks
    else if (index == 56) {
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, 0, 1);

        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();

        // put an enemy defeated count on the screen, in red with a small font
        jl.hud.addText({ x: .5, y: 8, face: "Arial", color: "#FF0000", size: 10, z: 2 }, () => jl.score.getEnemiesDefeated() + "/4 Enemies Defeated");

        // make a moveable obstacle that can defeat enemies
        let o = jl.world.makeObstacle({ x: 10, y: 2, width: 1, height: 1, img: "blueball.png" });
        o.setPhysics(5, 0, 0.6);
        o.setMoveByTilting();
        // when this obstacle collides with any enemy, it checks the enemy's "extra".  If it
        // matches "big", then this obstacle defeats the enemy, and the obstacle disappears.
        o.setEnemyCollisionCallback((thisActor: Obstacle, collideActor: Enemy) => {
            if (collideActor.getExtra() === "big") {
                collideActor.defeat(true, undefined);
                thisActor.remove(true);
            }
        });

        // make a small obstacle that can defeat any enemy, and doesn't disappear
        let o2 = jl.world.makeObstacle({ x: .5, y: .5, width: .5, height: .5, img: "blueball.png" });
        o2.setPhysics(5, 0, 0.6);
        o2.setMoveByTilting();
        o2.setEnemyCollisionCallback((_thisActor: Obstacle, collideActor: Enemy) => {
            collideActor.defeat(true, undefined);
        });
        // make four enemies.  Mark the big one, so we can defeat it with the big obstacle
        jl.world.makeEnemy({ x: 10, y: 2, width: .5, height: .5, img: "redball.png" });
        jl.world.makeEnemy({ x: 10, y: 4, width: .5, height: .5, img: "redball.png" });
        jl.world.makeEnemy({ x: 10, y: 6, width: .5, height: .5, img: "redball.png" });
        let e3 = jl.world.makeEnemy({ x: 10, y: 7, width: 2, height: 2, img: "redball.png" });
        e3.setExtra("big");

        // win by defeating enemies
        jl.score.setVictoryEnemyCount(4);

        welcomeMessage(jl, "You can defeat two enemies with the blue ball");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // this level shows an odd way of moving the world. There's friction on the floor, so the hero
    // can only move by tilting while the hero is in the air
    else if (index == 57) {
        jl.world.resetGravity(0, 10);
        jl.world.enableTilt(10, 0);
        // note: the floor has lots of friction
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, 0, 10);
        jl.world.makeDestination({ x: 15, y: 8.5, width: .5, height: .5, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // make a box hero with friction... it won't roll on the floor, so it's stuck!
        let h = jl.world.makeHero({ box: true, x: .25, y: .25, width: .75, height: .75, img: "legstar1.png" });
        h.disableRotation();
        h.setPhysics(5, 0, 5);
        h.setMoveByTilting();

        // the hero *can* jump...
        h.setTouchToJump();
        h.setJumpImpulses(0, 10);

        // draw a background
        jl.world.setBackgroundColor(0x17B4FF);
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "mid.png" }, 0);

        welcomeMessage(jl, "Press the hero to make it jump");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // this level shows that we can put an obstacle on the screen and use it to make the hero
    // throw projectiles. It also shows that we can make entities that shrink over time...
    // growth is possible too, by using a negative value.
    else if (index == 58) {
        jl.world.resetGravity(0, -10);
        jl.world.enableTilt(10, 0);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        // put a hero on a shrinking wall
        let h = jl.world.makeHero({ x: 2, y: 2, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        let floor = jl.world.makeObstacle({ box: true, x: 1, y: 1, width: 8, height: 1, img: "red.png" });
        floor.setShrinkOverTime(.1, .1, true);

        // make an obstacle that causes the hero to throw Projectiles when touched
        let o = jl.world.makeObstacle({ x: 15, y: 2, width: 1, height: 1, img: "purpleball.png" });
        o.setCollisionsEnabled(false);
        o.setTouchToThrow(h, .125, .75, 0, 15);

        // set up our projectiles.  There are only 20... throw them carefully
        jl.projectiles.configure(3, .5, .5, "colorstar.png", 2, 0, true);
        jl.projectiles.setLimitOnThrows(20);

        // Allow the projectile image to be chosen randomly from a set of images
        jl.projectiles.setImageSource(["colorstar1.png", "colorstar2.png", "colorstar3.png", "colorstar4.png"]);

        // show how many shots are left
        jl.hud.addText({ x: .5, y: 8.5, face: "Arial", color: "#FF00FF", size: 12, z: 2 }, () => jl.projectiles.getRemaining() + " projectiles left");

        // draw a bunch of enemies to defeat
        let e = jl.world.makeEnemy({ x: 4, y: 5, width: .5, height: .5, img: "redball.png" });
        e.setPhysics(1.0, 0.3, 0.6);
        e.setRotationSpeed(1);
        for (let i = 1; i < 20; i += 5)
            jl.world.makeEnemy({ x: 1 + i / 2, y: 7, width: 1, height: 1, img: "redball.png" });

        // draw a few obstacles that shrink over time, to show that circles
        // and boxes work, we can shrink the X and Y rates independently,
        // and we can opt to center things as they shrink or grow

        let roof = jl.world.makeObstacle({ box: true, x: 2, y: 8, width: 1, height: 1, img: "red.png" });
        roof.setShrinkOverTime(-1, 0, false);

        let ball1 = jl.world.makeObstacle({ x: 3, y: 7, width: 1, height: 1, img: "purpleball.png" });
        ball1.setShrinkOverTime(.1, .2, true);

        let ball2 = jl.world.makeObstacle({ x: 11, y: 6, width: 2, height: 2, img: "purpleball.png" });
        ball2.setShrinkOverTime(.2, .1, false);

        jl.score.setVictoryEnemyCount(5);

        welcomeMessage(jl, "Actors can shrink and grow\n\n" +
            "(Be sure to disable debug boxes in MyConfig.java)");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // this level shows that we can make a hero in the air rotate. Rotation
    // doesn't do anything, but it looks nice...
    else if (index == 59) {
        jl.world.resetGravity(0, 10);
        jl.world.enableTilt(10, 0);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        welcomeMessage(jl, "Press to rotate the hero");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");

        jl.world.makeDestination({ x: 15, y: 4, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // make the hero jumpable, so that we can see it spin in the air
        let h = jl.world.makeHero({ x: 4, y: 8, width: .5, height: .5, img: "legstar1.png" });
        h.setPhysics(1, 0, 0.6);
        h.setMoveByTilting();
        h.setJumpImpulses(0, 10);
        h.setTouchToJump();

        // add rotation buttons
        jl.hud.addToggleButton({ x: 0, y: 0, width: 8, height: 9, img: "" }, jl.hud.makeRotator(h, -.05), jl.hud.makeRotator(h, -.05));
        jl.hud.addToggleButton({ x: 8, y: 0, width: 8, height: 9, img: "" }, jl.hud.makeRotator(h, .05), jl.hud.makeRotator(h, .05));
    }

    // we can attach movement buttons to any moveable entity, so in this
    // case, we attach it to an obstacle to get an arkanoid-like effect.
    else if (index == 60) {
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 0, 0, 0);

        jl.world.makeDestination({ x: 14, y: 1, width: .25, height: .25, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // make a hero who is always moving... note there is no friction,
        // anywhere, and the hero is elastic... it won't ever stop...
        let h = jl.world.makeHero({ x: 4, y: 4, width: .5, height: .5, img: "greenball.png" });
        h.setPhysics(0, 1, .1);
        h.addVelocity(0, 10);

        // make an obstacle and then connect it to some controls
        let o = jl.world.makeObstacle({ box: true, x: 2, y: 8.5, width: 1, height: .5, img: "red.png" });
        o.setPhysics(100, 1, .1);
        jl.hud.addToggleButton({ x: 0, y: 0, width: 8, height: 9, img: "" }, jl.hud.makeXMotionAction(o, -5), jl.hud.makeXMotionAction(o, 0));
        jl.hud.addToggleButton({ x: 8, y: 0, width: 8, height: 9, img: "" }, jl.hud.makeXMotionAction(o, 5), jl.hud.makeXMotionAction(o, 0));
    }

    // this level demonstrates that things can appear and disappear on
    // simple timers
    else if (index == 61) {
        jl.world.enableTilt(10, 10);
        welcomeMessage(jl, "Things will appear  and disappear...");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();

        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // create an enemy that will quietly disappear after 2 seconds
        let e1 = jl.world.makeEnemy({ x: 1, y: 1, width: 2, height: 2, img: "redball.png" });
        e1.setPhysics(1.0, 0.3, 0.6);
        e1.setRotationSpeed(1);
        e1.setDisappearDelay(2, true);

        // create an enemy that will appear after 3 seconds
        let e2 = jl.world.makeEnemy({ x: 5, y: 5, width: 2, height: 2, img: "redball.png" });
        e2.setPhysics(1.0, 0.3, 0.6);
        e2.setPath(new Path().to(5, 5).to(10, 7).to(5, 5), 3, true);
        e2.setAppearDelay(3);
    }

    // This level demonstrates the use of timer callbacks. We can use timers
    // to make more of the level appear over time. In this case, we'll chain
    // the timer callbacks together, so that we can get more and more things
    // to develop. 
    else if (index == 62) {
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        welcomeMessage(jl, "There's nothing to do... yet");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");

        // note: there's no destination yet, but we still say it's how to
        // win... we'll get a destination in this level after a few timers
        // run...
        jl.score.setVictoryDestination(1);

        // set a timer callback. after three seconds, the callback will run
        jl.addTimer(2, false, () => {
            jl.nav.setPauseSceneBuilder((overlay: OverlayApi) => {
                overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFF00", size: 12, z: 0 }, () => "Ooh... a draggable enemy");
                overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "" }, (_hudx: number, _hudY: number) => {
                    jl.nav.dismissOverlayScene();
                    return true;
                });
                // make a draggable enemy
                // don't forget drag zone
                let e3 = jl.world.makeEnemy({ x: 8, y: 7, width: 2, height: 2, img: "redball.png" });
                e3.setPhysics(1.0, 0.3, 0.6);
                e3.setDraggable(true);
                jl.hud.createDragZone({ x: 0, y: 0, width: 16, height: 9, img: "" });
            });
        });

        // set another callback that runs after 6 seconds (note: time
        // doesn't count while the PauseScene is showing...)
        jl.addTimer(6, false, () => {
            jl.nav.setPauseSceneBuilder((overlay: OverlayApi) => {
                overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FF00FF", size: 12, z: 0 }, () => "Touch the enemy and it will go away");
                overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "" }, (_hudx: number, _hudY: number) => {
                    jl.nav.dismissOverlayScene();
                    return true;
                });
                // add an enemy that is touch-to-defeat
                let e4 = jl.world.makeEnemy({ x: 9, y: 5, width: 1, height: 1, img: "redball.png" });
                e4.setPhysics(1.0, 0.3, 0.6);
                e4.setDisappearOnTouch();
            });
        });

        // set a callback that runs after 9 seconds.
        jl.addTimer(9, false, () => {
            // draw an enemy, a goodie, and a destination, all with
            // fixed velocities
            jl.nav.setPauseSceneBuilder((overlay: OverlayApi) => {
                overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFF00", size: 12, z: 0 }, () => "Now you can see the rest of the level");
                overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "" }, (_hudx: number, _hudY: number) => {
                    jl.nav.dismissOverlayScene();
                    return true;
                });
                let d = jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
                d.addVelocity(-.5, -1);

                let e5 = jl.world.makeEnemy({ x: 3, y: 3, width: 1, height: 1, img: "redball.png" });
                e5.setPhysics(1.0, 0.3, 0.6);
                e5.addVelocity(4, 4);

                let gg = jl.world.makeGoodie({ x: 10, y: 1, width: 2, height: 2, img: "blueball.png" });
                gg.addVelocity(5, 5);
            });
        });

        // Lastly, we can make a timer callback that runs over and over
        // again. This one starts after 2 seconds
        let spawnLoc = 0;
        jl.addTimer(2, true, () => {
            jl.world.makeObstacle({ x: spawnLoc % 16, y: Math.floor(spawnLoc / 9), width: 1, height: 1, img: "purpleball.png" });
            spawnLoc++;
        });
    }

    // This level shows callbacks that run on a collision between hero and
    // obstacle. In this case, it lets us draw out the next part of the
    // level later, instead of drawing the whole thing right now. In a real
    // level, we'd draw a few screens at a time, and not put the callback
    // obstacle at the end of a screen, so that we'd never see the drawing
    // of stuff taking place, but for this demo, that's actually a nice
    // effect.
    else if (index == 63) {
        jl.world.enableTilt(10, 10);
        welcomeMessage(jl, "Keep going right!");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 64, 9, "", 1, .3, 1);
        jl.world.setCameraBounds(64, 9);

        let h = jl.world.makeHero({ x: 2, y: 1, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        jl.world.setCameraChase(h);

        jl.hud.addText({ x: .1, y: 8.5, face: "Arial", color: "#3C46FF", size: 12, z: 2 }, () => jl.score.getGoodies1() + " Goodies");
        jl.score.setVictoryDestination(1);

        // this obstacle is a collision callback... when the hero hits it,
        // the next part of the level appears.
        // Note, too, that it disappears when the hero hits it, so we can
        // play a sound if we want...
        let o = jl.world.makeObstacle({ box: true, x: 14, y: 0, width: 1, height: 9, img: "purpleball.png" });
        o.setPhysics(1, 0, 1);
        // NB: we use a level fact to track how far we've come
        jl.score.setLevelFact("crossings", "0");
        // the callback id is 0, there is no delay, and no goodies are
        // needed before it works
        o.setHeroCollisionCallback((thisActor: Obstacle, _collideActor: Hero) => {
            // get rid of the obstacle we just collided with
            thisActor.remove(false);
            // make a goodie
            jl.world.makeGoodie({ x: 18, y: 8, width: 1, height: 1, img: "blueball.png" });
            // make an obstacle that is a callback, but that doesn't
            // work until the goodie count is 1
            let oo = jl.world.makeObstacle({ box: true, x: 30, y: 0, width: 1, height: 9, img: "purpleball.png" });

            // we're going to chain a bunch of callbacks together, and
            // the best way to do that is to make a single callback that
            // behaves differently based on the value of some information we save as part of the level (a "LevelFact")
            let sc2 = (thisActor: Obstacle, _collideActor: Hero) => {
                let crossings = parseInt(jl.score.getLevelFact("crossings", "0"));
                // The second callback works the same way
                if (crossings == 0) {
                    thisActor.remove(false);
                    jl.world.makeGoodie({ x: 46, y: 8, width: 1, height: 1, img: "blueball.png" });

                    let oo = jl.world.makeObstacle({ box: true, x: 50, y: 0, width: 1, height: 9, img: "purpleball.png" });
                    oo.setHeroCollisionCallback(sc2); // missing check for goodies 2 (2, 0, 0, 0, 0, sc2);
                    jl.score.setLevelFact("crossings", "1");
                }
                // same for the third callback
                else if (crossings == 1) {
                    thisActor.remove(false);
                    jl.world.makeGoodie({ x: 58, y: 8, width: 1, height: 1, img: "blueball.png" });

                    let oo = jl.world.makeObstacle({ box: true, x: 60, y: 0, width: 1, height: 9, img: "purpleball.png" });
                    oo.setHeroCollisionCallback(sc2); // missing check for goodies 3 (3, 0, 0, 0, 0, sc2);
                    jl.score.setLevelFact("crossings", "2");
                }
                // The fourth callback draws the destination
                else if (crossings == 2) {
                    thisActor.remove(false);
                    // print a message and pause the game, via PauseScene
                    jl.nav.setPauseSceneBuilder((overlay: OverlayApi) => {
                        overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "black.png" }, (_hudx: number, _hudY: number) => {
                            jl.nav.dismissOverlayScene();
                            return true;
                        });
                        overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 32, z: 0 }, () => "The destination is now available");
                        jl.world.makeDestination({ x: 63, y: 8, width: 1, height: 1, img: "mustardball.png" });
                    });
                }
            };
            oo.setHeroCollisionCallback(sc2);
            oo.setDisappearSound("hipitch.ogg");
        });
    }

    // this level demonstrates callbacks that happen when we touch an
    // obstacle.
    else if (index == 64) {
        jl.world.enableTilt(10, 10);
        welcomeMessage(jl, "Activate and then touch the obstacle");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();

        // make a destination... notice that it needs a lot more goodies
        // than are on the screen...
        let d = jl.world.makeDestination({ x: 15, y: 1, width: 1, height: 1, img: "mustardball.png" });
        d.setOnAttemptArrival(() => { return jl.score.getGoodies1() >= 3; });
        jl.score.setVictoryDestination(1);

        // draw an obstacle, make it a touch callback, and then draw the
        // goodie we need to get in order to activate the obstacle
        let o = jl.world.makeObstacle({ x: 10, y: 5, width: .5, height: .5, img: "purpleball.png" });
        o.setPhysics(1, 0, 1);
        o.setTouchCallback(() => { return jl.score.getGoodies1() >= 1; }, true,
            (actor: WorldActor) => {
                // note: we could draw a picture of an open chest in the
                // obstacle's place, or even use a disappear animation whose
                // final frame looks like an open treasure chest.
                actor.remove(false);
                for (let i = 0; i < 3; ++i)
                    jl.world.makeGoodie({ x: 3 * i, y: 9 - i, width: .5, height: .5, img: "blueball.png" });
            });
        o.setDisappearSound("hipitch.ogg");

        let g = jl.world.makeGoodie({ x: 0, y: 0, width: 2, height: 2, img: "blueball.png" });
        g.setCollectCallback((_g: Goodie, _h: Hero) => jl.playSound("lowpitch.ogg"));
    }


    // this level shows how to use enemy defeat callbacks. There are four
    // ways to defeat an enemy, so we enable all mechanisms in this level,
    // to see if they all work to cause enemy callbacks to run the
    // enemy collision callback code.
    else if (index == 65) {
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 0, 0, 0);

        // give the hero strength, so that we can use it to defeat an enemy
        // as a test of enemy callbacks
        let h = jl.world.makeHero({ x: 5, y: 5, width: .75, height: .75, img: "greenball.png" });
        h.setStrength(3);
        h.setMoveByTilting();
        h.setInvincibleAnimation(jl.makeComplexAnimation(true).to("colorstar5.png", 100).to("colorstar6.png", 100).to("colorstar7.png", 100).to("colorstar8.png", 100));

        // a goodie, so we can do defeat by invincibility
        let g1 = jl.world.makeGoodie({ x: 10, y: 5, width: .5, height: .5, img: "purpleball.png" });
        g1.setCollectCallback((_g: Goodie, h: Hero) => { h.setInvincibleRemaining(15); });

        // enable throwing projectiles, so that we can test enemy callbacks
        // again
        h.setTouchToThrow(h, .75, .375, -20, 0);
        jl.projectiles.configure(100, .2, .21, "greyball.png", 1, 0, true);

        // add an obstacle that has an enemy collision callback, so it can
        // defeat enemies
        let o = jl.world.makeObstacle({ x: 15, y: 0, width: 1, height: 1, img: "blueball.png" });
        o.setPhysics(1000, 0, 0);
        o.setDraggable(false);
        jl.hud.createDragZone({ x: 0, y: 0, width: 16, height: 9, img: "" });
        o.setEnemyCollisionCallback((_thisActor: Obstacle, collideActor: Enemy) => {
            if (collideActor.getExtra() === "weak") {
                collideActor.defeat(true, undefined);
            }
        });

        // now draw our enemies... we need enough to be able to test that
        // all four defeat mechanisms work. Note that we attach defeat
        // callback code to each of them, but the callback only runs on a collision-based defeat
        let sc = (_e: Enemy, _actor?: WorldActor) => {
            // always reset the pausescene, in case it has something on it from before...
            jl.nav.setPauseSceneBuilder((overlay: OverlayApi) => {
                overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#58E2A0", size: 16, z: 0 }, () => "good job, here's a prize");
                overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "" }, (_hudx: number, _hudY: number) => {
                    jl.nav.dismissOverlayScene();
                    return true;
                });
                // use random numbers to figure out where to draw a goodie
                // as a reward... picking in the range 0-8,0-15 ensures
                // that with width and height of 1, the goodie stays on
                // screen
                jl.world.makeGoodie({ x: jl.getRandom(15), y: jl.getRandom(8), width: 1, height: 1, img: "blueball.png" });
            });
        };
        let e1 = jl.world.makeEnemy({ x: 1, y: 1, width: 1, height: 1, img: "redball.png" });
        e1.setOnDefeated(sc);

        let e2 = jl.world.makeEnemy({ x: 1, y: 3, width: 1, height: 1, img: "redball.png" });
        e2.setOnDefeated(sc);
        e2.setExtra("weak");

        let e3 = jl.world.makeEnemy({ x: 1, y: 5, width: 1, height: 1, img: "redball.png" });
        e3.setOnDefeated(sc);

        let e4 = jl.world.makeEnemy({ x: 1, y: 7, width: 1, height: 1, img: "redball.png" });
        e4.setOnDefeated(sc);
        e4.setDisappearOnTouch();

        let e5 = jl.world.makeEnemy({ x: 1, y: 8, width: 1, height: 1, img: "redball.png" });
        e5.setOnDefeated(sc);

        // win by defeating enemies
        jl.score.setVictoryEnemyCount();
    }

    // This level shows that we can resize a hero on the fly, and change its
    // image. We use a collision callback to cause the effect. Furthermore,
    // we can increment scores inside of the callback code, which lets us
    // activate the destination on an obstacle collision
    else if (index == 66) {
        jl.world.enableTilt(10, 10);
        welcomeMessage(jl, "Only stars can reach the destination");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        let h = jl.world.makeHero({ x: 1, y: 8, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();

        jl.hud.addText({ x: .1, y: 8.5, face: "Arial", color: "#3C46FF", size: 12, z: 2 }, () => jl.score.getGoodies1() + " Goodies");

        // the destination won't work until some goodies are collected...
        let d = jl.world.makeDestination({ x: 15, y: 1, width: 1, height: 1, img: "colorstar1.png" });
        d.setOnAttemptArrival(() => { return jl.score.getGoodies1() >= 4 && jl.score.getGoodies2() >= 1 && jl.score.getGoodies3() >= 3; });
        jl.score.setVictoryDestination(1);

        // Colliding with this star will make the hero into a star
        let o = jl.world.makeObstacle({ box: true, x: 15, y: 8, width: 1, height: 1, img: "legstar1.png" });
        o.setPhysics(1, 0, 1);
        o.setHeroCollisionCallback((thisActor: Obstacle, collideActor: Hero) => {
            // here's a simple way to increment a goodie count
            jl.score.incrementGoodies2();
            // here's a way to set a goodie count
            jl.score.setGoodies3(3);
            // here's a way to read and write a goodie count
            jl.score.setGoodies1(4 + jl.score.getGoodies1());
            // get rid of the star, so we know it's been used
            thisActor.remove(true);
            // resize the hero, and change its image
            collideActor.resize(collideActor.getXPosition(), collideActor.getYPosition(), .75, .75);
            collideActor.setImage("legstar1.png");
        });
    }


    // This level shows how to use countdown timers to win a level, tests
    // some color features, and introduces a vector throw mechanism with
    // fixed velocity
    else if (index == 67) {
        jl.world.resetGravity(0, 10);
        welcomeMessage(jl, "Press anywhere to throw a ball");
        winMessage(jl, "You Survived!");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        // Here's a simple pause button and pause scene

        jl.hud.addTapControl({ x: 0, y: 300, width: 20, height: 20, img: "red.png" }, (_hudX: number, _hudY: number) => {
            jl.nav.setPauseSceneBuilder((overlay: OverlayApi) => {
                overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 32, z: 0 }, () => "Game Paused");
                overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "" }, (_hudx: number, _hudY: number) => {
                    jl.nav.dismissOverlayScene();
                    return true;
                });
            });
            return true;
        });

        // draw a hero, and a button for throwing projectiles in many
        // directions. Note that this is going to look like an "asteroids"
        // game, with a hero covering the bottom of the screen, so that
        // anything that falls to the bottom counts against the player
        let h = jl.world.makeHero({ box: true, x: 0, y: 8.5, width: 16, height: .5, img: "greenball.png" });
        jl.hud.addDirectionalThrowButton({ x: 0, y: 0, width: 16, height: 9, img: "" }, h, 100, 0, -.5);

        // set up our pool of projectiles, then set them to have a fixed
        // velocity when using the vector throw mechanism
        jl.projectiles.configure(100, .2, .2, "greyball.png", 1, 0, true);
        jl.projectiles.setRange(20);
        jl.projectiles.setFixedVectorThrowVelocity(5);

        // we're going to win by "surviving" for 25 seconds... with no
        // enemies, that shouldn't be too hard
        jl.score.setWinCountdown(25);
        jl.hud.addText({ x: 28, y: 250, face: "Arial", color: "#C0C0C0", size: 16, z: 2 }, () => "" + jl.score.getWinCountdown());
        // just to play it safe, let's say that we win on reaching a destination...
        // this ensures that collecting goodies or defeating enemies won't
        // accidentally cause us to win. Of course, with no destination,
        // there's no way to win now, except surviving.
        jl.score.setVictoryDestination(1);
    }


    // We can make a hero hover, and then have it stop hovering when it is
    // flicked or moved. This demonstrates the effect via
    // flick. It also shows that an enemy (or obstacle/goodie/destination)
    // can fall due to gravity.
    else if (index == 68) {

        jl.world.resetGravity(0, 10);
        welcomeMessage(jl, "Flick the hero into the destination");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        let h = jl.world.makeHero({ box: true, x: 1, y: 7, width: 1, height: 1, img: "greenball.png" });
        h.setHover(1, 7);
        h.setFlickable(0.7);
        jl.hud.createSwipeZone({ x: 0, y: 0, width: 16, height: 9, img: "" });

        // place an enemy, let it fall
        let e = jl.world.makeEnemy({ x: 15, y: 1, width: 1, height: 1, img: "redball.png" });
        e.setCanFall();

        jl.world.makeDestination({ x: 4, y: 0, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
    }


    // The default behavior is for a hero to be able to jump any time it
    // collides with an obstacle. This isn't, of course, the smartest way to
    // do things, since a hero in the air shouldn't jump. One way to solve
    // the problem is by altering the presolve code in JetLag's physics engine. Another
    // approach, which is much simpler, is to mark some walls so that the
    // hero doesn't have jump re-enabled upon a collision.
    else if (index == 69) {

        jl.world.resetGravity(0, 10);
        jl.world.enableTilt(10, 0);
        welcomeMessage(jl, "Press the hero to make it jump");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, 0, 1);

        jl.world.makeDestination({ x: 15, y: 8, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(.5, 0, 0.6);
        h.setMoveByTilting();
        h.setTouchToJump();
        h.setJumpImpulses(0, 10);

        // hero can jump while on this obstacle
        let o1 = jl.world.makeObstacle({ box: true, x: 6, y: 7, width: 3, height: .1, img: "red.png" });
        o1.setPhysics(1, 0, .5);

        // hero can't jump while on this obstacle
        let o2 = jl.world.makeObstacle({ box: true, x: 10, y: 7, width: 3, height: .1, img: "red.png" });
        o2.setReJump(false);
        o1.setPhysics(1, 0, .5);
    }


    // When something chases an entity, we might not want it to chase in
    // both the X and Y dimensions... this shows how we can chase in a
    // single direction.
    else if (index == 70) {
        // set up a simple level
        jl.world.enableTilt(10, 10);
        welcomeMessage(jl, "You can walk through the wall");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "legstar1.png" });
        h.setMoveByTilting();

        jl.world.makeDestination({ x: 14, y: 2, width: 2, height: 2, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // These obstacles chase the hero, but only in one dimension
        let e = jl.world.makeObstacle({ x: 0, y: 0, width: 1, height: 1, img: "red.png" });
        e.setChaseSpeed(15, h, false, true);
        e.setCollisionsEnabled(true);
        let e2 = jl.world.makeObstacle({ x: 0, y: 0, width: 1, height: 1, img: "red.png" });
        e2.setChaseSpeed(15, h, true, false);
        e2.setCollisionsEnabled(true);

        // Here's a wall, and a movable round obstacle
        let o = jl.world.makeObstacle({ box: true, x: 7, y: 1, width: .5, height: 5, img: "red.png" });
        let o2 = jl.world.makeObstacle({ x: 8, y: 8, width: 2, height: 2, img: "blueball.png" });
        o2.setMoveByTilting();

        // The hero can pass through this wall, because both have the same
        // passthrough value
        h.setPassThrough(7);
        o.setPassThrough(7);
    }


    // PokeToPlace is nice, but sometimes it's nicer to use Poke to cause
    // movement to the destination, instead of an immediate jump.
    else if (index == 71) {
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 0, 0, 0);
        welcomeMessage(jl, "Poke the hero, then  where you want it to go.");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");

        // This hero moves via poking. the "false" means that we don't have
        // to poke hero, poke location, poke hero, poke location, ...
        // Instead, we can poke hero, poke location, poke location. 
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "legstar1.png" });
        h.setDefaultAnimation(jl.makeAnimation(200, true, ["legstar1.png", "legstar1.png"]));
        h.setDefaultReverseAnimation(jl.makeAnimation(200, true, ["fliplegstar8.png", "fliplegstar8.png"]));
        h.setTapHandler(() => { jl.hud.setActiveActor(h); return true; })
        jl.hud.createPokeToMoveZone({ x: 0, y: 0, width: 16, height: 9, img: "" }, 5, false);

        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // sometimes a control needs to have a large touchable area, but a
        // small image. One way to do it is to make an invisible control,
        // then put a picture on top of it. This next line shows how to draw
        // a picture on the HUD
        jl.world.drawPicture({ x: 2, y: 2, width: 2, height: 2, img: "red.png" });
    }


    // It can be useful to make a hero stick to an obstacle. As an example,
    // if the hero should stand on a platform that moves along a path, then
    // we will want the hero to "stick" to it, even as the platform moves
    // downward.
    else if (index == 72) {
        jl.world.resetGravity(0, 10);
        welcomeMessage(jl, "Press screen borders to move,  the hero");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, 0, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.disableRotation();
        h.setJumpImpulses(0, 10);
        h.setTouchToJump();
        // give a little friction, to help the hero stick to platforms
        h.setPhysics(2, 0, .5);

        // create a destination
        jl.world.makeDestination({ x: 14, y: 4, width: 2, height: 2, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // This obstacle is sticky on top... Jump onto it and watch what
        // happens
        let o = jl.world.makeObstacle({ box: true, x: 2, y: 6, width: 2, height: .25, img: "red.png" });
        o.setPath(new Path().to(2, 6).to(4, 8).to(6, 6).to(4, 4).to(2, 6), 1, true);
        o.setPhysics(100, 0, .1);
        o.setSticky(true, false, false, false);

        // This obstacle is not sticky... it's not nearly as much fun
        let o2 = jl.world.makeObstacle({ box: true, x: 11, y: 6, width: 2, height: .25, img: "red.png" });
        o2.setPath(new Path().to(10, 6).to(12, 8).to(14, 6).to(12, 4).to(10, 6), 1, true);
        o2.setPhysics(100, 0, 1);

        // draw some buttons for moving the hero
        jl.hud.addToggleButton({ x: 0, y: 0, width: 1, height: 8, img: "" }, jl.hud.makeXMotionAction(h, -5), jl.hud.makeXMotionAction(h, 0));
        jl.hud.addToggleButton({ x: 15, y: 0, width: 1, height: 8, img: "" }, jl.hud.makeXMotionAction(h, 5), jl.hud.makeXMotionAction(h, 0));
    }

    // When using "vector" projectiles, if the projectile isn't a circle we
    // might want to rotate it in the direction of travel. Also, this level
    // shows how to do walls that can be passed through in one direction.
    else if (index == 73) {
        jl.world.enableTilt(10, 10);
        welcomeMessage(jl, "Press anywhere to shoot a laserbeam");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.disableRotation();
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();

        jl.world.makeDestination({ x: 15.25, y: 8.25, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // draw a button for throwing projectiles in many directions. It
        // only covers half the screen, to show how such an effect would
        // behave
        jl.hud.addDirectionalThrowButton({ x: 0, y: 0, width: 8, height: 9, img: "" }, h, 100, 0, 0);

        // set up a pool of projectiles with fixed velocity, and with
        // rotation
        jl.projectiles.configure(100, .02, 1, "red.png", 1, 0, false);
        jl.projectiles.setFixedVectorThrowVelocity(10);
        jl.projectiles.setRotateVectorThrow();

        // create a box that is easy to fall into, but hard to get out of,
        // by making its sides each "one-sided"
        let top = jl.world.makeObstacle({ box: true, x: 3, y: 3, width: 3, height: .2, img: "red.png" });
        top.setOneSided(2);
        let left = jl.world.makeObstacle({ box: true, x: 3, y: 3, width: .2, height: 3, img: "red.png" });
        left.setOneSided(1);
        let right = jl.world.makeObstacle({ box: true, x: 6, y: 3, width: .2, height: 3, img: "red.png" });
        right.setOneSided(3);
        let bottom = jl.world.makeObstacle({ box: true, x: 3, y: 7.5, width: 3, height: .2, img: "red.png" });
        bottom.setOneSided(0);
    }


    // This level shows how to use multiple types of goodie scores
    else if (index == 74) {
        jl.world.enableTilt(10, 10);
        welcomeMessage(jl, "Green, Red, and Grey balls are goodies");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        let h = jl.world.makeHero({ x: .25, y: 8.25, width: .75, height: .75, img: "legstar1.png" });
        h.setMoveByTilting();

        // the destination requires lots of goodies of different types
        let d = jl.world.makeDestination({ x: 15.25, y: .75, width: .75, height: .75, img: "mustardball.png" });
        d.setOnAttemptArrival(() => { return jl.score.getGoodies1() >= 1 && jl.score.getGoodies2() >= 1 && jl.score.getGoodies3() >= 3; });
        jl.score.setVictoryDestination(1);

        jl.hud.addText({ x: 1, y: 1, face: "Arial", color: "#00FFFF", size: 16, z: 2 }, () => jl.score.getGoodies1() + " blue");
        jl.hud.addText({ x: 1, y: 1.5, face: "Arial", color: "#00FFFF", size: 16, z: 2 }, () => jl.score.getGoodies2() + " green");
        jl.hud.addText({ x: 1, y: 2, face: "Arial", color: "#00FFFF", size: 16, z: 2 }, () => jl.score.getGoodies3() + " red");

        jl.score.setLoseCountdown(100);
        jl.hud.addText({ x: 15, y: 8, face: "Arial", color: "#000000", size: 32, z: 2 }, () => jl.score.getLoseCountdown().toFixed() + "");

        // draw the goodies
        for (let i = 0; i < 3; ++i) {
            let b = jl.world.makeGoodie({ x: 1.5 * i, y: 4, width: .25, height: .25, img: "blueball.png" });
            b.setScore(1, 0, 0, 0);
            let g = jl.world.makeGoodie({ x: 1.5 * i + .5, y: 4 - i / 2, width: .25, height: .25, img: "greenball.png" });
            g.setScore(0, 1, 0, 0);
            let r = jl.world.makeGoodie({ x: 1.5 * i + 2, y: 4 - i, width: .25, height: .25, img: "redball.png" });
            r.setScore(0, 0, 1, 0);
        }

        // When the hero collides with this obstacle, we'll increase the
        // time remaining
        let o = jl.world.makeObstacle({ box: true, x: 14, y: 8, width: 1, height: 1, img: "red.png" });
        o.setHeroCollisionCallback((thisActor: Obstacle, _collideActor: Hero) => {
            // add 15 seconds to the timer
            jl.score.updateTimerExpiration(15);
            thisActor.remove(true);
        });
    }

    // this level shows passthrough objects and chase again, to help
    // demonstrate how chase works
    else if (index == 75) {
        jl.world.enableTilt(10, 10);
        welcomeMessage(jl, "You can walk through the wall");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "legstar1.png" });
        h.setMoveByTilting();

        jl.world.makeDestination({ x: 14, y: 2, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        h.setPassThrough(7); // make sure obstacle has same value

        // the enemy chases the hero, but can't get through the wall
        let e = jl.world.makeEnemy({ x: 14, y: 2, width: .5, height: .5, img: "red.png" });
        e.setChaseSpeed(1, h, true, true);

        let o = jl.world.makeObstacle({ box: true, x: 12, y: 1, width: .1, height: 7, img: "red.png" });
        o.setPassThrough(7);
    }


    // We can have a control that increases the hero's speed while pressed,
    // and decreases it upon release
    else if (index == 76) {
        jl.world.resetGravity(0, 10);
        welcomeMessage(jl, "Press anywhere to speed up");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 64, 9, "", 1, 0, 0);

        jl.world.makeDestination({ x: 63, y: 8, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        let h = jl.world.makeHero({ box: true, x: 2, y: 4, width: .75, height: 1.5, img: "greenball.png" });
        h.disableRotation();
        h.setPhysics(1, 0, 0);
        // give the hero a fixed velocity
        h.addVelocity(4, 0);
        // center the camera a little ahead of the hero
        h.setCameraOffset(5, 0);
        jl.world.setCameraBounds(64, 9);
        jl.world.setCameraChase(h);

        // set up the background
        jl.world.setBackgroundColor(0x17B4FF);
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "mid.png" }, 0);

        // draw a turbo boost button that covers the whole screen... make
        // sure its "up" speeds match the hero velocity
        jl.hud.addToggleButton({ x: 0, y: 0, width: 16, height: 9, img: "" }, jl.hud.makeXYMotionAction(h, 15, 0), jl.hud.makeXYMotionAction(h, 4, 0));
    }


    // Sometimes, we want to make the hero move when we press a control, but
    // when we release we don't want an immediate stop. This shows how to
    // achieve that effect.
    else if (index == 77) {
        jl.world.resetGravity(0, 10);
        welcomeMessage(jl, "Press anywhere to start moving");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 64, 9, "", 1, 0, 0);

        jl.world.makeDestination({ x: 63, y: 8, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        let h = jl.world.makeHero({ box: true, x: 2, y: 4, width: .75, height: 1.5, img: "greenball.png" });
        h.disableRotation();
        h.setPhysics(1, 0, 0);
        h.setCameraOffset(5, 0);
        jl.world.setCameraChase(h);
        jl.world.setCameraBounds(64, 9);

        jl.world.setBackgroundColor(0x17B4FF);
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "mid.png" }, 0);

        // This control has a dampening effect, so that on release, the hero
        // slowly stops
        jl.hud.addToggleButton({ x: 0, y: 0, width: 16, height: 9, img: "" }, jl.hud.makeXYDampenedMotionAction(h, 10, 0, 0), jl.hud.makeXYDampenedMotionAction(h, 10, 0, 1));
    }


    // One-sided obstacles can be callback obstacles. This allows, among
    // other things, games like doodle jump. This level shows how it all
    // interacts.
    else if (index == 78) {

        jl.world.resetGravity(0, 10);
        jl.world.enableTilt(10, 0);
        welcomeMessage(jl, "One-sided + Callbacks");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.disableRotation();
        h.setPhysics(1, 0, .5);
        h.setMoveByTilting();
        h.setJumpImpulses(0, 10);
        h.setTouchToJump();

        jl.world.makeDestination({ x: 15, y: 8, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // create a platform that we can jump through from below
        let platform = jl.world.makeObstacle({ box: true, x: 3, y: 7.5, width: 2, height: .2, img: "red.png" });
        // Set a callback, then re-enable the platform's collision effect.
        platform.setHeroCollisionCallback((_thisActor: Obstacle, collideActor: Hero) => {
            collideActor.setAbsoluteVelocity(collideActor.getXVelocity(), -5);
        });
        platform.setCollisionsEnabled(true);
        platform.setOneSided(0);

        // make the z index of the platform -1, so that the hero (index 0)
        // will be drawn on top of the box, not under it
        platform.setZIndex(-1);
    }


    // This level fleshes out some more poke-to-move stuff. Now we'll say
    // that once a hero starts moving, the player must re-poke the hero
    // before it can be given a new position. Also, the hero will keep
    // moving after the screen is released. We will also show the Fact
    // interface.
    else if (index == 79) {
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 0, 0, 0);
        welcomeMessage(jl, "Poke the hero, then  where you want it to go.");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");

        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "legstar1.png" });
        h.setDefaultAnimation(jl.makeAnimation(200, true, ["legstar1.png", "legstar1.png"]));
        h.setDefaultReverseAnimation(jl.makeAnimation(200, true, ["fliplegstar8.png", "fliplegstar8.png"]));
        h.setTapHandler(() => { jl.hud.setActiveActor(h); return true; })
        h.setPhysics(1, 0, .5);
        jl.hud.createPokeToRunZone({ x: 0, y: 0, width: 16, height: 9, img: "" }, 5, true);

        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        jl.hud.addText({ x: .25, y: .5, face: "Arial", color: "#000000", size: 12, z: 2 }, () => "Level: " + jl.score.getLevelFact("level test", "-1"));
        jl.hud.addText({ x: .25, y: .75, face: "Arial", color: "#000000", size: 12, z: 2 }, () => "Session: " + jl.score.getSessionFact("session test", "-1"));
        jl.hud.addText({ x: .25, y: 1, face: "Arial", color: "#000000", size: 12, z: 2 }, () => "Game: " + jl.score.getGameFact("game test", "-1"));

        jl.hud.addTapControl({ x: 0, y: .5, width: .2, height: .25, img: "red.png" }, (_x: number, _y: number) => {
            jl.score.setLevelFact("level test", "" + (1 + parseInt(jl.score.getLevelFact("level test", "-1"))));
            return true;
        });
        jl.hud.addTapControl({ x: 0, y: .75, width: .2, height: .25, img: "red.png" }, (_x: number, _y: number) => {
            jl.score.setSessionFact("session test", "" + (1 + parseInt(jl.score.getSessionFact("session test", "-1"))));
            return true;
        });
        jl.hud.addTapControl({ x: 0, y: 1, width: .2, height: .25, img: "red.png" }, (_x: number, _y: number) => {
            jl.score.setGameFact("game test", "" + (1 + parseInt(jl.score.getGameFact("game test", "-1"))));
            return true;
        });
    }

    // Sometimes we need to manually force an entity to be immune to
    // gravity.
    else if (index == 80) {
        jl.world.resetGravity(0, 10);
        jl.world.enableTilt(10, 0);
        welcomeMessage(jl, "Testing Gravity Defy?");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.disableRotation();
        h.setPhysics(1, 0, 0.6);
        h.setMoveByTilting();
        h.setJumpImpulses(0, 15);
        h.setTouchToJump();

        let d = jl.world.makeDestination({ x: 15, y: 4, width: 1, height: 1, img: "mustardball.png" });
        // note: it must not be immune to physics (third parameter true), or
        // it will pass through the bounding box, but we do want it to move
        // and not fall downward
        d.setAbsoluteVelocity(-2, 0);
        d.setGravityDefy();
        jl.score.setVictoryDestination(1);
    }


    // Test to show that we can have obstacles with a polygon shape
    else if (index == 81) {
        jl.world.enableTilt(10, 10);
        welcomeMessage(jl, "Testing Polygons");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.disableRotation();
        h.setMoveByTilting();

        jl.world.makeDestination({ x: 15, y: 4, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // create a polygon obstacle
        // Be sure to turn on debug boxes in myconfig.ts to see the true shape
        let o = jl.world.makeObstacle({ x: 2, y: 2, width: 2, height: 5, img: "blueball.png", verts: [-1, 2, -1, 0, 0, -3, 1, 0, 1, 1] });
        o.setShrinkOverTime(.1, .1, true);
    }


    // A place for playing with a side-scrolling platformer that has lots of
    // features
    else if (index == 82) {
        // set up a standard side scroller with tilt:

        jl.world.resetGravity(0, 10);
        jl.world.enableTilt(10, 0);
        welcomeMessage(jl, "Press the hero to make it jump");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 64, 9, "", 1, 0, 1);
        jl.world.setCameraBounds(64, 9)
        jl.world.makeDestination({ x: 63, y: 8, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // set up a simple jumping hero
        let h = jl.world.makeHero({ box: true, x: 1, y: 8, width: 1, height: .5, img: "greenball.png" });
        h.setJumpImpulses(0, 10);
        h.setTouchToJump();
        h.setMoveByTilting();
        jl.world.setCameraChase(h);

        // This enemy can be defeated by jumping. Note that the hero's
        // bottom must be higher than the enemy's middle point, or the jump
        // won't defeat the enemy.  Also remember that the hero has to be in 
        // mid-jump.  If it fell off an obstacle, or if it hit an obstacle after
        // jumping, this won't defeat the enemy.
        let e = jl.world.makeEnemy({ x: 15, y: 7, width: 1, height: 1, img: "redball.png" });
        e.setDefeatByJump();
    }

    // Demonstrate the ability to set up paddles that rotate back and forth
    else if (index == 83) {
        jl.world.enableTilt(10, 10);
        welcomeMessage(jl, "Avoid revolving obstacles");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, 0, 1);

        let h = jl.world.makeHero({ x: 5, y: 8, width: 1, height: 1, img: "greenball.png" });
        h.setMoveByTilting();

        // Note: you must give density to the revolving part...
        let revolving = jl.world.makeObstacle({ box: true, x: 1.5, y: 4, width: 5, height: 1, img: "red.png" });
        revolving.setPhysics(1, 0, 0);
        let anchor = jl.world.makeObstacle({ box: true, x: 7.5, y: 4, width: 1, height: 1, img: "blueball.png" });
        anchor.setPhysics(1, 0, 0);

        revolving.setRevoluteJoint(anchor, 0, 0, 0, 2);
        // Note that we could add limits like this:
        revolving.setRevoluteJointLimits(1.7, -1.7);
        revolving.setRevoluteJointMotor(.5, Number.POSITIVE_INFINITY);
        jl.world.makeDestination({ x: 15, y: 8, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
    }

    // Demonstrate one-time callback controls
    else if (index == 84) {
        // start by setting everything up just like in level 1
        jl.world.enableTilt(10, 10);
        let h = jl.world.makeHero({ x: 2, y: 3, width: .75, height: .75, img: "greenball.png" });
        h.setMoveByTilting();
        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
        winMessage(jl, "Great Job");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 0, 0, 0);
        welcomeMessage(jl, "Reach the destination\nto win this level");

        // add a one-time callback control
        let hasPaused = false;
        let w = jl.hud.addTapControl({ x: .1, y: .1, width: .5, height: .5, img: "pause.png" }, (_x: number, _y: number) => {
            if (hasPaused)
                return false;
            hasPaused = true;
            jl.nav.setPauseSceneBuilder((overlay: OverlayApi) => {
                overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "black.png" }, (_hudx: number, _hudY: number) => {
                    jl.nav.dismissOverlayScene();
                    return true;
                });
                overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 20, z: 0 }, () => "you can only pause once...");
            });
            w.setImage("");
            return true;
        });
    }

    // Demonstrate weld joints
    else if (index == 85) {
        jl.world.enableTilt(10, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, 0, 1);
        jl.world.makeDestination({ x: 15, y: 1, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // set up a hero and fuse an obstacle to it
        let h = jl.world.makeHero({ x: 4, y: 2, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        let o = jl.world.makeObstacle({ x: 1, y: 1, width: 1, height: 1, img: "blueball.png" });
        o.setCanFall();
        h.setWeldJoint(o, 3, 0, 0, 0, 45);
    }


    // Demonstrate that we can have callback buttons on PauseScenes
    else if (index == 86) {
        jl.world.enableTilt(10, 10);
        welcomeMessage(jl, "Interactive Pause Scenes (click the red square)");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setMoveByTilting();
        jl.world.makeDestination({ x: 15, y: 8, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // Demonstrate the ability to chase while keeping existing velocity
        // in one direction
        let o = jl.world.makeObstacle({ x: 15, y: 15, width: 2, height: 2, img: "purpleball.png" });
        o.setAbsoluteVelocity(5, 1);
        o.setChaseFixedMagnitude(h, 3, 0, false, true);

        // Create a pause scene that has a back button on it, and a button
        // for pausing the level
        jl.hud.addTapControl({ x: 0, y: 0, width: 1, height: 1, img: "red.png" }, (_hudX: number, _hudY: number) => {
            jl.nav.setPauseSceneBuilder((overlay: OverlayApi) => {
                overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 32, z: 0 }, () => "Game Paused");
                overlay.addTapControl({ x: 3, y: 1, width: 1, height: 1, img: "red.png" }, (_eventPositionX: number, _eventPositionY: number) => {
                    jl.nav.dismissOverlayScene();
                    jl.nav.doChooser(1);
                    return true;
                });

                overlay.addTapControl({ x: 1, y: 1, width: 1, height: 1, img: "red.png" }, (_eventPositionX: number, _eventPositionY: number) => {
                    jl.nav.dismissOverlayScene();
                    jl.score.winLevel();
                    return true;
                });
                overlay.addTapControl({ x: 5, y: 1, width: 1, height: 1, img: "red.png" }, () => {
                    jl.nav.dismissOverlayScene();
                    jl.score.loseLevel();
                    return true;
                });

                overlay.addTapControl({ x: 7, y: 1, width: 1, height: 1, img: "red.png" }, () => {
                    jl.nav.dismissOverlayScene();
                    jl.nav.setPauseSceneBuilder((overlay: OverlayApi) => {
                        // clear the pausescene, draw another one
                        overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "black.png" }, () => {
                            jl.nav.dismissOverlayScene();
                            return true;
                        });
                        overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 32, z: 0 }, () => "This is a second pause scene!");
                    });
                    return true;
                });
            });
            return true;
        });
    }

    // Use multiple heroes, and insist that they don't get defeated
    else if (index == 87) {

        welcomeMessage(jl, "Keep both heroes alive!");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");

        jl.world.resetGravity(0, 10);
        jl.world.enableTilt(10, 0);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, .3, 1);

        // now let's draw two heroes who can both move by tilting, and
        // who both have density and friction. Note that we lower the
        // density, so they move faster
        let h1 = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h1.setPhysics(1, 0, 0.6);
        h1.setMoveByTilting();
        h1.setJumpImpulses(0, 10);
        h1.setTouchToJump();
        h1.setMustSurvive();

        let h2 = jl.world.makeHero({ box: true, x: 0, y: 8.5, width: 16, height: .5, img: "red.png" });
        h2.setMustSurvive();
        h1.setPassThrough(1);
        h2.setPassThrough(1);

        let e1 = jl.world.makeEnemy({ x: 15, y: 0.1, width: 1, height: 1, img: "redball.png" });
        e1.setChaseSpeed(1, h1, true, true);

        jl.world.makeDestination({ x: 15, y: 7, width: .75, height: .75, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
    }


    // Demonstrate that we can control many entities via the same callback
    else if (index == 88) {
        jl.world.resetGravity(0, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 0, 1, .1);
        welcomeMessage(jl, "Keep pressing until a hero makes it to the destination");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");

        let heroes: Hero[] = [];
        for (let i = 0; i < 16; ++i) {
            let h = jl.world.makeHero({ box: true, x: i + .2, y: 8, width: .25, height: .25, img: "greenball.png" });
            h.setPhysics(1, 1, 5);
            heroes.push(h);
        }

        jl.world.makeDestination({ x: 7.5, y: .25, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        jl.hud.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "" }, (_x: number, _y: number) => {
            for (let h of heroes) {
                h.setAbsoluteVelocity(5 - jl.getRandom(10), -3);
            }
            return true;
        });
    }

    // Demo a truck, using distance and revolute joints
    else if (index == 89) {
        jl.world.resetGravity(0, 10);
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, 0, 1);

        let truck = jl.world.makeHero({ box: true, x: 1, y: 8, width: 2, height: .5, img: "red.png" });
        truck.setPhysics(1, 0, 0);
        let head = jl.world.makeObstacle({ x: 1.75, y: 7.5, width: .5, height: .5, img: "blueball.png" });
        head.setPhysics(1, 0, 0);
        let backWheel = jl.world.makeObstacle({ x: .75, y: 8.5, width: .5, height: .5, img: "blueball.png" });
        backWheel.setPhysics(3, 0, 1);
        let frontWheel = jl.world.makeObstacle({ x: 2.75, y: 8.5, width: .5, height: .5, img: "blueball.png" });
        frontWheel.setPhysics(3, 0, 1);

        backWheel.setRevoluteJoint(truck, -1, .5, 0, 0);
        backWheel.setRevoluteJointMotor(10, 10);
        frontWheel.setRevoluteJoint(truck, 1, .5, 0, 0);
        frontWheel.setRevoluteJointMotor(10, 10);

        // this is not how we want the head to look, but it makes for a nice
        // demo
        head.setDistanceJoint(truck, 0, -1, 0, 0);

        jl.world.makeDestination({ x: 15, y: 8, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);
    }

    // Show how to make an "infinite" level, and add a foreground layer
    else if (index == 90) {
        // set up a standard side scroller with tilt, but make it really really long:
        jl.world.setCameraBounds(300000, 9);
        jl.world.resetGravity(0, 10);
        welcomeMessage(jl, "Press to make the hero go up");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 300000, 9, "", 0, 0, 0);

        // make a hero
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        jl.world.setCameraChase(h);
        h.setAbsoluteVelocity(5, 0);
        h.disableRotation();
        h.setPhysics(.1, 0, 0);

        // touching the screen makes the hero go upwards
        jl.hud.addToggleButton({ x: 0, y: 0, width: 16, height: 9, img: "" }, jl.hud.makeYMotionAction(h, -5), jl.hud.makeYMotionAction(h, 0));

        // set up our background, with a few layers
        jl.world.setBackgroundColor(0x17B4FF);
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "back.png" }, 1);
        jl.world.addHorizontalForegroundLayer({ x: 0, y: 0, width: 16, height: 9, img: "mid.png" }, 0);
        jl.world.addHorizontalBackgroundLayer({ x: 0, y: 5, width: 16, height: 2.8, img: "front.png" }, -.5);

        // we win by collecting 10 goodies...
        jl.score.setVictoryGoodies(10, 0, 0, 0);
        jl.hud.addText({ x: 1, y: 1, face: "Arial", color: "#FFFFFF", size: 20, z: 2 }, () => jl.score.getGoodies1() + " goodies");

        // now set up an obstacle and attach a callback to it
        //
        // Note that the obstacle needs to be final or we can't access it within the callback
        let trigger = jl.world.makeObstacle({ box: true, x: 16, y: 0, width: 1, height: 9, img: "" });
        let lc =
            // Each time the hero hits the obstacle, we'll run this code to draw a new enemy
            // and a new obstacle on the screen.  We'll randomize their placement just a bit.
            // Also move the obstacle forward, so we can hit it again.
            (_thisActor: Obstacle, _collideActor: Hero) => {
                // make a random enemy and a random goodie.  Put them in X coordinates relative to the trigger
                jl.world.makeEnemy({ x: trigger.getXPosition() + 8 + jl.getRandom(10), y: jl.getRandom(8), width: .5, height: .5, img: "redball.png" });
                jl.world.makeGoodie({ x: trigger.getXPosition() + 9 + jl.getRandom(10), y: jl.getRandom(8), width: .5, height: .5, img: "blueball.png" });
                // move the trigger so we can hit it again
                trigger.setPosition(trigger.getXPosition() + 16, trigger.getYPosition());
            };
        trigger.setHeroCollisionCallback(lc);
        // No transfer of momentum when the hero collides with the trigger
        trigger.setCollisionsEnabled(false);
    }

    // JetLag has limited support for SVG. If you draw a picture in Inkscape or another SVG
    // tool, and it only consists of lines, then you can import it into your game as a set of
    // obstacles. Drawing a picture on top of the obstacle is probably a good idea, though we
    // don't bother in this level
    else if (index == 91) {
        // We'll use tilt and jump to control the hero in this level
        jl.world.setCameraBounds(340, 90);
        //jl.world.resetGravity(0, 10);
        //jl.world.enableTilt(10, 0);
        jl.world.enableTilt(10, 10);



        jl.world.setTiltAsVelocity(true);
        // jl.world.drawBoundingBox(0, 0, 34, 9, "", 1, .3, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.setPhysics(5, 0, 0.6);
        h.setJumpImpulses(0, 20);
        h.setTouchToJump();
        h.setMoveByTilting();
        jl.world.setCameraChase(h);
        jl.world.makeDestination({ x: 33, y: 8, width: 1, height: 1, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // draw an obstacle from SVG.  We are stretching it in the X and Y dimensions, and also
        // moving it rightward and upward
        jl.world.drawSVG("shape.svg", 5, 5, 2, 2, (actor: WorldActor) => {
            // This code is run each time a line of the SVG is drawn.  When we draw a line,
            // we'll give it some density and friction.  Remember that the line is
            // actually a rotated obstacle.
            actor.setPhysics(1, 0, .1);
            actor.setImage("red.png");
        });


        // add zoom buttons. We are using blank images, which means that the buttons will be
        // invisible... that's nice, because we can make the buttons big (covering the left and
        // right halves of the screen).  When debug rendering is turned on, we'll be able to see
        // an outline of the two rectangles. You could also use images (that you registered,
        // of course), but if you did, you'd either need to make them small (maybe by drawing
        // some pictures in addition to Tap controls), or make them semi-transparent.
        jl.hud.addTapControl({ x: 0, y: 0, width: 8, height: 9, img: "" }, () => {
            if (jl.world.getZoom() > 50)
                jl.world.setZoom(jl.world.getZoom() - 10);
            return true;
        });
        jl.hud.addTapControl({ x: 8, y: 0, width: 16, height: 9, img: "" }, () => {
            if (jl.world.getZoom() < 200)
                jl.world.setZoom(jl.world.getZoom() + 20);
            return true;
        });

        welcomeMessage(jl, "Obstacles can be drawn from SVG files");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
    }

    // This is for working with sticky + passthrough
    else if (index == 92) {
        jl.world.resetGravity(0, 10);
        welcomeMessage(jl, "Press screen borders to move,  the hero");
        winMessage(jl, "Great Job");
        loseMessage(jl, "Try Again");
        jl.world.drawBoundingBox(0, 0, 16, 9, "", 1, 0, 1);
        let h = jl.world.makeHero({ x: .25, y: 5.25, width: .75, height: .75, img: "greenball.png" });
        h.disableRotation();
        h.setJumpImpulses(0, 10);
        h.setTouchToJump();
        // give a little friction, to help the hero stick to platforms
        h.setPhysics(2, 0, .5);

        // create a destination
        jl.world.makeDestination({ x: 14, y: 4, width: 2, height: 2, img: "mustardball.png" });
        jl.score.setVictoryDestination(1);

        // This obstacle is sticky on top... Jump onto it and watch what
        // happens
        let o = jl.world.makeObstacle({ box: true, x: 2, y: 6, width: 2, height: .25, img: "red.png" });
        o.setPath(new Path().to(2, 6).to(4, 8).to(6, 6).to(4, 4).to(2, 6), 1, true);
        o.setPhysics(100, 0, .1);
        o.setSticky(true, false, false, false);
        o.setOneSided(0);

        // This obstacle is not sticky... it's not nearly as much fun
        let o2 = jl.world.makeObstacle({ box: true, x: 11, y: 6, width: 2, height: .25, img: "red.png" });
        o2.setPath(new Path().to(10, 6).to(12, 8).to(14, 6).to(12, 4).to(10, 6), 1, true);
        o2.setPhysics(100, 0, 1);

        // draw some buttons for moving the hero
        jl.hud.addToggleButton({ x: 0, y: 0, width: 1, height: 8, img: "" }, jl.hud.makeXMotionAction(h, -5), jl.hud.makeXMotionAction(h, 0));
        jl.hud.addToggleButton({ x: 15, y: 0, width: 1, height: 8, img: "" }, jl.hud.makeXMotionAction(h, 5), jl.hud.makeXMotionAction(h, 0));
    }

    // Put the level number in the top right corner of every level
    jl.hud.addText({ x: 15, y: .5, face: "arial", color: "#872436", size: 22, z: 2 }, () => "Level " + index);
}

/**
 * This is a standard way of drawing a black screen with some text, to serve as
 * the welcome screen for the game
 */
export function welcomeMessage(jl: JetLagApi, message: string) {
    // this next line can be confusing.  We are going to put some text in the middle of the
    // pre-scene, so it is centered at (8, 4.5).  The text will be white (#FFFFF) because
    // the default pre-scene background is black, size 32pt.  The rest of the line provides
    // some power that we don't take advantage of yet.
    //
    // Note: '\n' means insert a line break into the text.
    jl.nav.setWelcomeSceneBuilder((overlay: OverlayApi) => {
        overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "black.png" }, () => {
            jl.nav.dismissOverlayScene();
            return true;
        });
        overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => message);
    });
}

/**
 * This is a standard way of drawing a black screen with some text, to serve as
 * the win screen for the game
 */
export function winMessage(jl: JetLagApi, message: string, callback?: () => void) {
    jl.nav.setWinSceneBuilder((overlay: OverlayApi) => {
        overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "black.png" }, () => {
            jl.nav.nextLevel();
            return true;
        });
        overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => message);
        if (callback)
            callback();
    });
}

/**
 * This is a standard way of drawing a black screen with some text, to serve as
 * the lose screen for the game
 */
export function loseMessage(jl: JetLagApi, message: string, callback?: () => void) {
    jl.nav.setLoseSceneBuilder((overlay: OverlayApi) => {
        overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "black.png" }, () => {
            jl.nav.repeatLevel();
            return true;
        });
        overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => message);
        if (callback)
            callback();
    });
}
