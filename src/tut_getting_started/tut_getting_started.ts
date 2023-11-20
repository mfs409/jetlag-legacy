import { initializeAndLaunch } from "../jetlag/Stage";
import { GameCfg } from "../jetlag/Config";
import { ImageSprite } from "../jetlag/Components/Appearance";
import { Actor } from "../jetlag/Entities/Actor";
import { stage } from "../jetlag/Stage";
import { RigidBodyComponent } from "../jetlag/Components/RigidBody";
import { InertMovement } from "../jetlag/Components/Movement";
import { Passive } from "../jetlag/Components/Role";

// TODO: Stop needing this
import * as Helpers from "../demo_game/helpers";

/**
 * GameConfig stores things like screen dimensions and other game configuration,
 * as well as the names of all the assets (images and sounds) used by this game.
 */
export class GameConfig implements GameCfg {
    // It's very unlikely that you'll want to change these next four values.
    // Hover over them to see what they mean.
    pixelMeterRatio = 100;
    screenDimensions = { width: 1600, height: 900 };
    adaptToScreenSize = true;

    // When you deploy your game, you'll want to change all of these
    canVibrate = true;
    forceAccelerometerOff = true;
    storageKey = "com.me.my_jetlag_game.storage";
    hitBoxes = true;

    // Here's where we name all the images/sounds/background music files.  You'll
    // probably want to delete these files from the assets folder, remove them
    // from these lists, and add your own.
    resourcePrefix = "./assets/";
    musicNames = ["tune.ogg"];
    soundNames = ["high_pitch.ogg", "low_pitch.ogg", "lose_sound.ogg", "win_sound.ogg", "slow_down.ogg", "woo_woo_woo.ogg", "flap_flap.ogg"];
    imageNames = [
        // The non-animated actors in the game
        "green_ball.png", "mustard_ball.png", "red_ball.png", "blue_ball.png", "purple_ball.png", "grey_ball.png",

        // Images that we use for buttons in the Splash and Chooser
        "left_arrow.png", "right_arrow.png", "back_arrow.png", "level_tile.png", "audio_on.png", "audio_off.png",

        // Some raw colors
        "black.png", "red.png", // TODO: stop needing these!

        // Background images for OverlayScenes
        "msg2.png", "fade.png",

        // The backgrounds for the Splash and Chooser
        "splash.png", "chooser.png",

        // Layers for Parallax backgrounds and foregrounds
        "mid.png", "front.png", "back.png",

        // The animation for a star with legs
        "leg_star_1.png", "leg_star_2.png", "leg_star_3.png", "leg_star_4.png", "leg_star_5.png", "leg_star_6.png", "leg_star_7.png", "leg_star_8.png",

        // The animation for the star with legs, with each image flipped
        "flip_leg_star_1.png", "flip_leg_star_2.png", "flip_leg_star_3.png", "flip_leg_star_4.png", "flip_leg_star_5.png", "flip_leg_star_6.png", "flip_leg_star_7.png", "flip_leg_star_8.png",

        // The flying star animation
        "fly_star_1.png", "fly_star_2.png",

        // Animation for a star that expands and then disappears
        "star_burst_1.png", "star_burst_2.png", "star_burst_3.png", "star_burst_4.png",

        // eight colored stars
        "color_star_1.png", "color_star_2.png", "color_star_3.png", "color_star_4.png", "color_star_5.png", "color_star_6.png", "color_star_7.png", "color_star_8.png",

        // background noise, and buttons
        "noise.png", "pause.png",
    ];

    // The name of the function that builds the initial screen of the game
    gameBuilder = tut_getting_started;
}


/**
 * buildSplashScreen is used to draw the scene that we see when the game starts.
 * In our case, it's just a menu.  The splash screen is mostly just branding: it
 * usually just has a big logo and then buttons for going to the level chooser,
 * the store, and the help scenes.  On a phone, it should also have a button for
 * quitting the app.
 *
 * There is usually only one splash screen, but JetLag allows for many, so there
 * is an index parameter.  In this code, we just ignore the index.
 *
 * @param index Which splash screen should be displayed
 */
export function tut_getting_started(_index: number) {
    // Based on the values in GameConfig.ts, we can expect to have a level that is
    // 1600x900 pixels (16x9 meters), with no default gravitational forces

    // start the music
    Helpers.setMusic("tune.ogg");

    // draw the background. Note that "Play", "Help", and "Quit" are part of the
    // image.  Since the world is 16x9 meters, and we want it to fill the screen,
    // we'll make its dimensions 16x9, and center it at (8, 4.5).  We use z = -2,
    // so this will be behind everything.
    Actor.Make({
        appearance: new ImageSprite({ width: 16, height: 9, img: "splash.png" }),
        rigidBody: RigidBodyComponent.Box({ cx: 8, cy: 4.5, width: 16, height: 9 }, stage.world, { collisionsEnabled: false }),
        movement: new InertMovement(),
        role: new Passive(),
    });

    // Place an invisible button over the "Play" text of the background image,
    // and set it up so that pressing it switches to the first page of the level
    // chooser.
    // test
    Helpers.addTapControl(stage.hud, { cx: 8, cy: 5.625, width: 2.5, height: 1.25, img: "" }, () => {
        stage.switchTo(() => { }, 1);
        return true;
    });

    // Do the same, but this button goes to the first help screen
    Helpers.addTapControl(stage.hud, { cx: 3.2, cy: 6.15, width: 1.8, height: 0.9, img: "" }, () => {
        stage.switchTo(() => { }, 1);
        return true;
    });

    // Set up the quit button
    Helpers.addTapControl(stage.hud, { cx: 12.75, cy: 6.1, width: 2, height: 0.9, img: "" }, () => {
        stage.score.doQuit();
        return true;
    });

    // Draw a mute button
    let cfg = { box: true, cx: 15, cy: 8, width: 0.75, height: 0.75, img: "audio_off.png" };
    let mute = Actor.Make({
        appearance: new ImageSprite(cfg),
        rigidBody: RigidBodyComponent.Box(cfg, stage.world),
        movement: new InertMovement(),
        role: new Passive(),
    });
    // If the game is not muted, switch the image
    if (Helpers.getVolume())
        (mute.appearance as ImageSprite).setImage("audio_on.png");
    // when the obstacle is touched, switch the mute state and update the picture
    mute.gestures = {
        tap: () => {
            Helpers.toggleMute();
            if (Helpers.getVolume()) (mute.appearance as ImageSprite).setImage("audio_on.png");
            else (mute.appearance as ImageSprite).setImage("audio_off.png");
            return true;
        }
    };
}

// call the function that kicks off the game
initializeAndLaunch("game-player", new GameConfig());