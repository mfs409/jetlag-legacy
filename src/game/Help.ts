import { JetLagApi } from "../jetlag/api/JetLagApi";

/**
 * buildHelpScreen draws the help screens.  Technically, a help screen can be
 * anything... even a playable level.  In this demonstration, we just provide a
 * bit of information about the demo game, and how to get started.  This is also
 * often a good place to put credits.
 * 
 * Here, we have two help screens, so that we can show how to move from one 
 * screen to the next
 * 
 * @param index Which help screen should be displayed
 * @param level The level to configure
 */
export function buildHelpScreen(index: number, jl: JetLagApi): void {
    // Our first scene describes the color coding that we use for the different entities in the game
    if (index == 1) {
        // By default, we have a level that is 1600x900 pixels (16x9 meters), with no default gravitational forces

        // Let's make the background light blue
        jl.world.setBackgroundColor(0x19698E);

        // put some information on the screen
        jl.world.addTextCentered(8, 1, "Arial", "#FFFFFF", 56, () => "The levels of this game demonstrate JetLag features", 0);

        jl.world.makeObstacleAsBox(.5, 2, .75, .75, "greenball.png");
        jl.world.addText(1.5, 2.25, "Arial", "#000000", 24, () => "You control the hero", 0);

        jl.world.makeObstacleAsBox(.5, 3, .75, .75, "blueball.png");
        jl.world.addText(1.5, 3.25, "Arial", "#000000", 24, () => "Collect these goodies", 0);

        jl.world.makeObstacleAsBox(.5, 4, .75, .75, "redball.png");
        jl.world.addText(1.5, 4.25, "Arial", "#000000", 24, () => "Avoid or defeat enemies", 0);

        jl.world.makeObstacleAsBox(.5, 5, .75, .75, "mustardball.png");
        jl.world.addText(1.5, 5.25, "Arial", "#000000", 24, () => "Reach the destination", 0);

        jl.world.makeObstacleAsBox(.5, 6, .75, .75, "purpleball.png");
        jl.world.addText(1.5, 6.25, "Arial", "#000000", 24, () => "These are walls", 0);

        jl.world.makeObstacleAsBox(.5, 7, .75, .75, "greyball.png");
        jl.world.addText(1.5, 7.25, "Arial", "#000000", 24, () => "Throw projectiles", 0);

        jl.world.addText(11, 8.5, "Arial", "#FFFFFF", 24, () => "(All image files are stored in the assets folder)", 0);

        // set up a control to go to the next help level on screen tap
        jl.hud.addTapControl(0, 0, 16, 9, "", () => {
            jl.nav.doHelp(2);
            return true;
        });
    }

    // Our second help scene is just here to show that it is possible to have more than one help scene.
    else if (index == 2) {
        // This is just like the previous screen, but with different text
        jl.world.setBackgroundColor(0x19698E);
        jl.world.addTextCentered(8, 1, "Arial", "#FFFFFF", 56, () => "Read, Write, Play", 0);
        jl.world.addTextCentered(8, 5, "Arial", "#FFFFFF", 32,
            () => "As you play through the levels of the sample game, be sure to read the code that accompanies\n" +
                "each world.  The levels aren't meant to be \"hard\", or even really \"fun\".  They are meant to show\n" +
                "you how to use the different features of JetLag, and to show you how the same features can\n" +
                "be used in many different ways, to achieve very different styles of game play.  JetLag has been\n" +
                "used to make racing games, platformers, side-scrollers, puzzle games, and even re-creations\n" +
                "of classic Atari games.  The possibilities are endless!\n\n" +
                "If you're not sure where to start, consider making small changes to the levels, such as changing\n" +
                "the numbers that are passed to different functions.\n\n" +
                "Start with the \"Levels.ts\" file in the \"src/game\" folder, then move on to other files in that folder,\n" +
                "until you have a plan for how to build your next game."
            , 0);

        // set up a control to go to the splash screen on screen tap
        jl.hud.addTapControl(0, 0, 16, 9, "", () => {
            jl.nav.doSplash(1);
            return true;
        });
    }
}