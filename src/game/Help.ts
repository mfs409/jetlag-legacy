import { JetLagApi as JetLagApi } from "../jetlag/api/JetLag";
import { JetLagKeys } from "../jetlag/support/Interfaces";

/**
 * buildHelpScreen draws the help screens.  Technically, a help screen can be
 * anything... even a playable level.  In this demonstration, we just provide a
 * bit of information about the demo game, and how to get started.  This is also
 * often a good place to put credits.
 *
 * For the purposes of this demonstration, there are two Help screens.  That
 * way, we can show how to move from one to the next.
 *
 * @param index Which help screen should be displayed
 * @param jl    The JetLag object, for putting stuff into the level
 */
export function buildHelpScreen(index: number, jl: JetLagApi): void {
    // This line ensures that, no matter what level we draw, the ESCAPE key is
    // configured to go back to the Splash.  We don't go to Splash on down-press
    // of ESCAPE, but when the key is released.
    jl.setUpKeyAction(JetLagKeys.ESCAPE, () => { jl.nav.doSplash(1); });

    // Our first scene describes the color coding that we use for the different
    // entities in the game
    if (index == 1) {
        // Note that this code is exactly the same as in Levels.ts, except that
        // there is no notion of "winning".  So, for example, based on our
        // configuration object, we should expect this Help screen to be drawn
        // in a level that is 1600x900 pixels (16x9 meters), with no default
        // gravitational forces

        // Light blue background
        jl.world.setBackgroundColor(0x19698E);

        // put some information and pictures on the screen
        jl.world.addText({ center: true, x: 8, y: 1, face: "Arial", color: "#FFFFFF", size: 56, producer: () => "The levels of this game demonstrate JetLag features", z: 0 });

        jl.world.makeObstacle({ box: true, x: .5, y: 2, width: .75, height: .75, img: "greenball.png" });
        jl.world.addText({ x: 1.5, y: 2.25, face: "Arial", color: "#000000", size: 24, producer: () => "You control the hero", z: 0 });

        jl.world.makeObstacle({ box: true, x: .5, y: 3, width: .75, height: .75, img: "blueball.png" });
        jl.world.addText({ x: 1.5, y: 3.25, face: "Arial", color: "#000000", size: 24, producer: () => "Collect these goodies", z: 0 });

        jl.world.makeObstacle({ box: true, x: .5, y: 4, width: .75, height: .75, img: "redball.png" });
        jl.world.addText({ x: 1.5, y: 4.25, face: "Arial", color: "#000000", size: 24, producer: () => "Avoid or defeat enemies", z: 0 });

        jl.world.makeObstacle({ box: true, x: .5, y: 5, width: .75, height: .75, img: "mustardball.png" });
        jl.world.addText({ x: 1.5, y: 5.25, face: "Arial", color: "#000000", size: 24, producer: () => "Reach the destination", z: 0 });

        jl.world.makeObstacle({ box: true, x: .5, y: 6, width: .75, height: .75, img: "purpleball.png" });
        jl.world.addText({ x: 1.5, y: 6.25, face: "Arial", color: "#000000", size: 24, producer: () => "These are walls", z: 0 });

        jl.world.makeObstacle({ box: true, x: .5, y: 7, width: .75, height: .75, img: "greyball.png" });
        jl.world.addText({ x: 1.5, y: 7.25, face: "Arial", color: "#000000", size: 24, producer: () => "Throw projectiles", z: 0 });

        jl.world.addText({ x: 11, y: 8.5, face: "Arial", color: "#FFFFFF", size: 24, producer: () => "(All image files are stored in the assets folder)", z: 0 });

        // set up a control to go to the next help level on screen tap
        jl.hud.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "" }, () => {
            jl.nav.doHelp(2);
            return true;
        });
    }

    // Our second help scene is just here to show that it is possible to have more than one help scene.
    else if (index == 2) {
        // This is just like the previous screen, but with different text
        jl.world.setBackgroundColor(0x19698E);
        jl.world.addText({ center: true, x: 8, y: 1, face: "Arial", color: "#FFFFFF", size: 56, producer: () => "Read, Write, Play", z: 0 });
        jl.world.addText({
            center: true, x: 8, y: 5, face: "Arial", color: "#FFFFFF", size: 32,
            producer: () => "As you play through the levels of the sample game, be sure to read the code that accompanies\n" +
                "each world.  The levels aren't meant to be \"hard\", or even really \"fun\".  They are meant to show\n" +
                "you how to use the different features of JetLag, and to show you how the same features can\n" +
                "be used in many different ways, to achieve very different styles of game play.  JetLag has been\n" +
                "used to make racing games, platformers, side-scrollers, puzzle games, and even re-creations\n" +
                "of classic Atari games.  The possibilities are endless!\n\n" +
                "If you're not sure where to start, consider making small changes to the levels, such as changing\n" +
                "the numbers that are passed to different functions.\n\n" +
                "Start with the \"Levels.ts\" file in the \"src/game\" folder, then move on to other files in that folder,\n" +
                "until you have a plan for how to build your next game."
            , z: 0
        });

        // set up a control to go to the splash screen on screen tap
        jl.hud.addTapControl({ x: 0, y: 0, width: 16, height: 9, img: "" }, () => {
            jl.nav.doSplash(1);
            return true;
        });
    }
}