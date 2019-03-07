import { JetLagApi } from "../jetlag/api/JetLagApi";
import { OverlayApi } from "../jetlag/api/OverlayApi";

/**
 * buildLevelScreen is used to draw the playable levels of the game
 *
 * We currently have 1 level
 *
 * @param index Which level should be displayed
 * @param jl    The JetLag object, for putting stuff into the level
 */
export function buildLevelScreen(index: number, jl: JetLagApi): void {
    // start the music
    jl.setMusic("tune.ogg");

    // Set up physics
    jl.world.setCameraBounds(200, 18); // the world is 200 meters wide, 18 meters high
    jl.world.resetGravity(0, 9.8); // Gravity is downward :)

    // Create a floor
    jl.world.makeObstacle({ x: 0, y: 18, width: 200, height: .1, box: true });

    // Draw the background
    jl.world.drawPicture({ x: 0, y: 0, width: 200, height: 18, img: "board.png" });
    jl.world.drawPicture({ x: 0, y: 17.57, width: 8, height: .43, img: "bottom.png" });
    jl.world.drawPicture({ x: 8, y: 17.57, width: 192, height: .43, img: "bottom_mini.png" });

    // Draw the girl
    let girl = jl.world.makeHero({ x: 2, y: 12, width: 1.26, height: 2.09, box: true, img: "walker1.png" });

    // Make the camera follow the girl
    girl.setCameraOffset(5, 0);
    jl.world.setCameraChase(girl);

    // Animate the girl and start her moving
    girl.setAbsoluteVelocity(5, 0);
    girl.setDefaultAnimation(jl.makeAnimation(200, true, ["walker1.png", "walker2.png", "walker3.png", "walker4.png"]));

    // Set up jumping for the girl
    girl.setJumpAnimation(jl.makeAnimation(200, true, ["jumper1.png", "jumper2.png", "jumper3.png", "jumper4.png"]));
    girl.setJumpImpulses(0, 8);
    jl.hud.addTapControl({ x: 0, y: 0, width: 16, height: 9 }, jl.hud.jumpAction(girl, 100));

    // Check if the girl has stopped moving
    jl.addTimer(.04, true, () => { if (girl.getXVelocity() == 0) jl.score.loseLevel(); })

    // Draw the pause button
    jl.hud.addTapControl({ x: 15.25, y: 1, width: .5, height: .5, img: "pause.png" }, () => { pause(jl); return true; });

    // Draw a back button
    jl.hud.addTapControl({ x: 15.25, y: .25, width: .5, height: .5, img: "backarrow.png" }, () => { jl.nav.doChooser(Math.ceil(index / 24)); return true; })

    // Show the distance and books collected
    jl.hud.addText({ x: .1, y: 0, face: "Arial", color: "#FFFFFF", size: 22, z: 2 }, () => Math.floor(girl.getXPosition()) + " m");
    jl.hud.addText({ x: .1, y: .5, face: "Arial", color: "#FFFFFF", size: 22, z: 2 }, () => jl.score.getGoodies1() + " Books");

    // Draw a few books for the girl to collect
    jl.world.makeGoodie({ box: true, x: 16, y: 16.5, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
    jl.world.makeGoodie({ box: true, x: 19, y: 13.5, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
    jl.world.makeGoodie({ box: true, x: 25, y: 13.5, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
    jl.world.makeGoodie({ box: true, x: 32, y: 16.5, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
    jl.world.makeGoodie({ box: true, x: 37, y: 13.5, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");

    // The girl has to jump over these bricks.  If she gets the book, she can't make it!
    jl.world.makeGoodie({ box: true, x: 39, y: 16.5, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
    jl.world.makeObstacle({ box: true, x: 41, y: 15, width: 3, height: 3, img: "bricks.png" });

    // The girl has to jump over this brick too.  If she tries to get the books, she'll have a hard time with the stairs
    jl.world.makeObstacle({ box: true, x: 49, y: 15, width: 3, height: 3, img: "bricks.png" });
    jl.world.makeGoodie({ box: true, x: 54, y: 10.5, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");

    // Draw two bricks as stairs.  The girl can't get under the second one... she has to go over it
    jl.world.makeObstacle({ box: true, x: 65, y: 15, width: 3, height: 3, img: "bricks.png" });
    jl.world.makeObstacle({ box: true, x: 73, y: 13, width: 3, height: 3, img: "bricks.png" });
    // If she gets this goodie, she'll miss the trampoline
    jl.world.makeGoodie({ box: true, x: 81, y: 7, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");

    // If the girl jumps, and lands on the trampoline, she'll get a huge bounce
    let trampoline = jl.world.makeObstacle({ box: true, x: 90, y: 17, width: 2, height: 1, img: "trampoline.png" });
    trampoline.setCollisionsEnabled(false); // otherwise she runs /through/ the trampoline
    trampoline.setHeroCollisionCallback(() => {
        // This runs on collision with the trampoline.  If she's moving downward, then make her fly upward
        if (girl.getYVelocity() > 0) {
            girl.setAbsoluteVelocity(girl.getXVelocity(), -15);
            jl.playSound("jump.mp3");
        }
    });

    // These are bricks and books in the sky.  The girl can only get them if she takes the trampoline
    jl.world.makeObstacle({ box: true, x: 100, y: 8, width: 3, height: 3, img: "bricks.png" });
    jl.world.makeGoodie({ box: true, x: 101.5, y: 7, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
    jl.world.makeGoodie({ box: true, x: 101.5, y: 6, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
    jl.world.makeObstacle({ box: true, x: 104, y: 8, width: 3, height: 3, img: "bricks.png" });
    jl.world.makeGoodie({ box: true, x: 105.5, y: 7, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
    jl.world.makeGoodie({ box: true, x: 105.5, y: 6, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
    jl.world.makeObstacle({ box: true, x: 110, y: 8, width: 3, height: 3, img: "bricks.png" });
    jl.world.makeGoodie({ box: true, x: 111.5, y: 7, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
    jl.world.makeGoodie({ box: true, x: 111.5, y: 6, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");

    // If the girl takes these stairs, she'll get stuck.  She should go under them instead
    jl.world.makeObstacle({ box: true, x: 118, y: 15, width: 3, height: 3, img: "bricks.png" });
    jl.world.makeObstacle({ box: true, x: 126, y: 13, width: 3, height: 3, img: "bricks.png" });
    jl.world.makeObstacle({ box: true, x: 135, y: 11, width: 3, height: 3, img: "bricks.png" });
    jl.world.makeGoodie({ box: true, x: 136.5, y: 10, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
    jl.world.makeObstacle({ box: true, x: 140, y: 8, width: 3, height: 3, img: "bricks.png" });
    jl.world.makeObstacle({ box: true, x: 140, y: 4, width: 3, height: 3, img: "bricks.png" });

    // The flag is the thing the girl needs to reach
    jl.world.drawPicture({ x: 179, y: 15, width: 1, height: 3, img: "flag.png" });

    // Make an invisible destination so that the girl can jump "over" the flag but still win
    let d = jl.world.makeDestination({ box: true, x: 180, y: 0, width: 1, height: 18, img: "" });
    // Make sure the girl has at least 10 books if she is going to win
    d.setOnAttemptArrival(() => { return jl.score.getGoodies1() >= 10; });
    jl.score.setVictoryDestination(1);

    // Draw an invisible enemy, so that the girl can "lose" if she reaches the end without having enough books
    jl.world.makeEnemy({ box: true, x: 181, y: 0, width: 1, height: 18, img: "" });

    // These are the messages to show at begin, win, and end times
    welcomeMessage(jl, "Help the girl collect at least 10 books and then get to the flag");
    winMessage(jl, "Great job!");
    loseMessage(jl, "Try again");
}

/** This is a standard way of drawing a welcome screen for the game */
function welcomeMessage(jl: JetLagApi, message: string) {
    // This says "when it's time to draw the welcome screen, run this code"
    jl.nav.setWelcomeSceneBuilder((overlay: OverlayApi) => {
        // Draw a background picture, and when it is touched, clear the welcome screen
        overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "board.png" }, () => {
            jl.nav.dismissOverlayScene();
            return true;
        });
        // Draw the text that was provided as "message", centered on the screen
        overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => message);
    });
}

/** This is a standard way of drawing a win screen for the game */
function winMessage(jl: JetLagApi, message: string) {
    jl.nav.setWinSceneBuilder((overlay: OverlayApi) => {
        jl.playSound("win.mp3");
        overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "board.png" }, () => {
            jl.nav.nextLevel();
            return true;
        });
        overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => message);
    });
}

/** This is a standard way of drawing a lose screen for the game */
function loseMessage(jl: JetLagApi, message: string) {
    jl.nav.setLoseSceneBuilder((overlay: OverlayApi) => {
        jl.playSound("lose.mp3");
        overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "board.png" }, () => {
            jl.nav.repeatLevel();
            return true;
        });
        overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => message);
    });
}

/** This creates a pause scene in response to the pause button being tapped */
function pause(jl: JetLagApi) {
    jl.nav.setPauseSceneBuilder((overlay: OverlayApi) => {
        overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "board.png" }, () => {
            jl.nav.dismissOverlayScene();
            return true;
        });
        overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 32, z: 0 }, () => "Game Paused");
    });
}