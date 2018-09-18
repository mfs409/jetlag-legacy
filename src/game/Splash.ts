import { JetLagApi } from "../jetlag/api/JetLagApi";

/**
 * buildSplashScreen has the code we use to set up the opening screen of the
 * game.  The splash screen is mostly just branding: it usually just has a big
 * logo and then buttons for going to the level chooser, the store, and the help
 * scenes.  On a phone, it should also have a button for quitting the app.
 * 
 * There is usually only one splash screen. However, we are required to take an
 * index parameter.  In this code, we just ignore the index.
 *
 * @param index Which splash screen should be displayed (typically you can 
 *              ignore this)
 * @param level The level to configure
 */
export function buildSplashScreen(index: number, jl: JetLagApi): void {
    // Based on the values in myconfig.ts, we can expect to have a level that is
    // 1600x900 pixels (16x9 meters), with no default gravitational forces

    // start the music
    jl.world.setMusic("tune.ogg");
    // draw the background. Note that "Play", "Help", and "Quit" are part of the image.
    jl.world.drawPicture(0, 0, 16, 9, "splash.png", -2); // NB: 16:9

    // Place an invisible button over the "Play" text on the background image, and set it up
    // so that pressing it switches to the first page of the level chooser.
    jl.hud.addTapControl(6.75, 5, 2.5, 1.25, "", (x: number, y: number) => {
        jl.nav.doChooser(1);
        return true;
    });

    // Do the same, but this button goes to the first help screen
    jl.hud.addTapControl(2.3, 5.7, 1.8, .9, "", (x: number, y: number) => {
        jl.nav.doHelp(1);
        return true;
    });

    // Set up the quit button
    jl.hud.addTapControl(11.75, 5.75, 2, .9, "", (x: number, y: number) => {
        jl.nav.doQuit();
        return true;
    });

    // Draw an obstacle that we can use as a mute button
    let o = jl.world.makeObstacleAsBox(15, 8, .75, .75, "audio_off.png");
    // If the game is not muted, switch the obstacle's image
    if (jl.nav.getVolume())
        o.setImage("audio_on.png");
    // when the obstacle is touched, run the 'go()' function to change the mute
    // state and update the obstacle's picture
    o.setTapCallback(() => {
        jl.nav.toggleMute();
        if (jl.nav.getVolume())
            o.setImage("audio_on.png");
        else
            o.setImage("audio_off.png");
        return true;
    });
}