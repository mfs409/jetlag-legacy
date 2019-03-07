import { JetLagApi } from "../jetlag/api/JetLagApi";
import { OverlayApi } from "../jetlag/api/OverlayApi";
import { JetLagKeys } from "../jetlag/support/JetLagKeys";

// TODO: add some more fun, and then comment it better

// TODO: get it onto stackblitz

// TODO: push, so that stackblitz can access assets...

/**
 * buildLevelScreen is used to draw the playable levels of the game
 *
 * We currently have 1 level
 *
 * @param index Which level should be displayed
 * @param jl    The JetLag object, for putting stuff into the level
 */
export function buildLevelScreen(index: number, jl: JetLagApi): void {

    // This line ensures that, no matter what level we draw, the ESCAPE key is configured to go back to the Chooser
    jl.setUpKeyAction(JetLagKeys.ESCAPE, () => { jl.nav.doChooser(Math.ceil(index / 24)); });

    if (index == 1) {
        // start the music
        jl.setMusic("tune.ogg");

        // Set up physics and the floor:
        jl.world.setCameraBounds(320, 18);
        jl.world.resetGravity(0, 9.8);
        let floor = jl.world.makeObstacle({ x: 0, y: 17.8, width: 320, height: .1, box: true });
        floor.setPhysics(0, 0, 0);

        // Draw the background
        jl.world.drawPicture({ x: 0, y: 0, width: 320, height: 18, img: "board.png" });
        jl.world.drawPicture({ x: 0, y: 17.57, width: 8, height: .43, img: "bottom.png" });
        jl.world.drawPicture({ x: 8, y: 17.57, width: 312, height: .43, img: "bottom_mini.png" });

        // Set up the girl:
        let girl = jl.world.makeHero({ x: 2, y: 12, width: 1.26, height: 2.09, box: true, img: "walker1.png" });
        jl.world.setCameraChase(girl);
        girl.setCameraOffset(5, 0);
        girl.setAbsoluteVelocity(5, 0);
        girl.setDefaultAnimation(jl.makeAnimation(200, true, ["walker1.png", "walker2.png", "walker3.png", "walker4.png"]));
        girl.setJumpAnimation(jl.makeAnimation(200, true, ["jumper1.png", "jumper2.png", "jumper3.png", "jumper4.png"]));
        girl.setJumpImpulses(0, 8);
        jl.hud.addTapControl({ x: 0, y: 0, width: 16, height: 9 }, jl.hud.jumpAction(girl, 100));
        jl.addTimer(.04, true, () => { if (girl.getXVelocity() == 0) jl.score.loseLevel(); })

        // Pause button
        jl.hud.addTapControl({ x: 15.25, y: .25, width: .5, height: .5, img: "pause.png" }, (): boolean => {
            jl.nav.setPauseSceneBuilder((overlay: OverlayApi) => {
                overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "board.png" }, (hudx: number, hudY: number) => {
                    jl.nav.dismissOverlayScene();
                    return true;
                });
                overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 32, z: 0 }, () => "Game Paused");
            });
            return true;
        })

        // Show the distance and books collected
        jl.hud.addText({ x: .1, y: 0, face: "Arial", color: "#FFFFFF", size: 22, z: 2 }, () => Math.floor(girl.getXPosition()) + " m");
        jl.hud.addText({ x: .1, y: .5, face: "Arial", color: "#FFFFFF", size: 22, z: 2 }, () => jl.score.getGoodies1() + " Books");

        // start drawing books and bricks
        jl.world.makeGoodie({ box: true, x: 16, y: 16.5, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
        jl.world.makeGoodie({ box: true, x: 19, y: 13.5, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
        jl.world.makeGoodie({ box: true, x: 25, y: 13.5, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
        jl.world.makeGoodie({ box: true, x: 32, y: 16.5, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
        jl.world.makeGoodie({ box: true, x: 37, y: 13.5, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");
        jl.world.makeGoodie({ box: true, x: 39, y: 16.5, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");

        jl.world.makeObstacle({ box: true, x: 41, y: 15, width: 3, height: 3, img: "bricks.png" });

        jl.world.makeObstacle({ box: true, x: 49, y: 15, width: 3, height: 3, img: "bricks.png" });
        jl.world.makeGoodie({ box: true, x: 54, y: 10.5, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");

        jl.world.makeObstacle({ box: true, x: 65, y: 15, width: 3, height: 3, img: "bricks.png" });
        jl.world.makeObstacle({ box: true, x: 73, y: 13, width: 3, height: 3, img: "bricks.png" });
        jl.world.makeGoodie({ box: true, x: 81, y: 7, width: 1, height: 1, img: "book.png" }).setDisappearSound("goodie.mp3");

        let trampoline = jl.world.makeObstacle({ box: true, x: 90, y: 17, width: 2, height: 1, img: "trampoline.png" });
        trampoline.setCollisionsEnabled(false);
        trampoline.setHeroCollisionCallback(() => {
            console.log("hit");
            if (girl.getYVelocity() > 0) {
                girl.setAbsoluteVelocity(girl.getXVelocity(), -15);
                jl.playSound("jump.mp3");
            }
        });

        jl.world.makeObstacle({ box: true, x: 100, y: 8, width: 3, height: 3, img: "bricks.png" });

        // TODO: it would be fun to have a place where getting on top of a
        // string of bricks is beneficial, and one where you really ought to go
        // underneath

        let d = jl.world.makeDestination({ box: true, x: 120, y: 0, width: 1, height: 18, img: "" });
        d.setOnAttemptArrival(() => { return jl.score.getGoodies1() >= 5; });
        jl.world.makeEnemy({ box: true, x: 121, y: 0, width: 1, height: 18, img: "" });
        jl.score.setVictoryDestination(1);
        jl.world.drawPicture({ x: 121, y: 14, width: 1, height: 4, img: "flag.png" });

        welcomeMessage(jl, "Help the girl\ncollect at least 10 books\nand get to the library");
        winMessage(jl, "Great job!");
        loseMessage(jl, "Try again");
    }
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
        overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "board.png" }, () => {
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
export function winMessage(jl: JetLagApi, message: string) {
    jl.nav.setWinSceneBuilder((overlay: OverlayApi) => {
        jl.playSound("win.mp3");
        overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "board.png" }, () => {
            jl.nav.nextLevel();
            return true;
        });
        overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => message);
    });
}

/**
 * This is a standard way of drawing a black screen with some text, to serve as
 * the lose screen for the game
 */
export function loseMessage(jl: JetLagApi, message: string) {
    jl.nav.setLoseSceneBuilder((overlay: OverlayApi) => {
        jl.playSound("lose.mp3");
        overlay.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "board.png" }, () => {
            jl.nav.repeatLevel();
            return true;
        });
        overlay.addText({ center: true, x: 8, y: 4.5, face: "Arial", color: "#FFFFFF", size: 28, z: 0 }, () => message);
    });
}
