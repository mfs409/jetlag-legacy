import { JetLagApi as JetLagApi } from "../jetlag/api/JetLag";

/**
 * buildSplashScreen has the code we use to set up the opening screen of the
 * game.  The splash screen is mostly just branding: it usually just has a big
 * logo and then buttons for going to the level chooser, the store, and the help
 * scenes.  On a phone, it should also have a button for quitting the app.
 *
 * There is usually only one splash screen, but JetLag allows for many, so there
 * is an index parameter.  In this code, we just ignore the index.
 *
 * @param index Which splash screen should be displayed (typically you can
 *              ignore this)
 * @param jl    The JetLag object, for putting stuff into the level
 */
export function buildSplashScreen(index: number, jl: JetLagApi): void {
    // Based on the values in myconfig.ts, we can expect to have a level that is
    // 1600x900 pixels (16x9 meters), with no default gravitational forces

    // start the music
    jl.setMusic("tune.ogg");

    // draw the background. Note that "Play", "Help", and "Quit" are part of the
    // image.
    jl.world.drawPicture({ x: 0, y: 0, width: 16, height: 9, img: "splash.png", z: -2 });

    // Place an invisible button over the "Play" text on the background image,
    // and set it up so that pressing it switches to the first page of the level
    // chooser.
    jl.hud.addTapControl({ x: 6.75, y: 5, width: 2.5, height: 1.25, img: "" }, () => {
        jl.nav.doChooser(1);
        return true;
    });

    // Do the same, but this button goes to the first help screen
    jl.hud.addTapControl({ x: 2.3, y: 5.7, width: 1.8, height: .9, img: "" }, () => {
        jl.nav.doHelp(1);
        return true;
    });

    // Set up the quit button
    jl.hud.addTapControl({ x: 11.75, y: 5.75, width: 2, height: .9, img: "" }, () => {
        jl.nav.doQuit();
        return true;
    });

    // Draw an obstacle that we can use as a mute button
    let o = jl.world.makeObstacle({ box: true, x: 15, y: 8, width: .75, height: .75, img: "audio_off.png" });
    // If the game is not muted, switch the obstacle's image
    if (jl.getVolume())
        o.setImage("audio_on.png");
    // when the obstacle is touched, switch the mute state and update the
    // obstacle's picture
    o.setTapHandler(() => {
        jl.toggleMute();
        if (jl.getVolume()) {
            o.setImage("audio_on.png");
        }
        else {
            o.setImage("audio_off.png");
        }
        return true;
    });
}