import { JetLagApi as JetLagApi } from "../jetlag/api/JetLagApi"
import { JetLagKeys } from "../jetlag/support/JetLagKeys";

/**
 * buildChooserScreen draws the level chooser screens.
 * 
 * Since we have 90 demo levels, and we show 24 levels per screen, our chooser
 * will have 4 screens.
 * 
 * @param index Which level screen should be displayed
 * @param jl    The JetLag object, for putting stuff into the level
 */
export function buildChooserScreen(index: number, jl: JetLagApi): void {
    // By default, we have a level that is 1600x900 pixels (16x9 meters), with
    // no default gravitational forces

    // This line ensures that, no matter what level we draw, the ESCAPE key is
    // configured to go back to the Splash
    jl.setUpKeyAction(JetLagKeys.ESCAPE, () => { jl.nav.doSplash(1); });

    // screen 1: show levels 1 --> 24
    //
    // When you need maximum control, this style of code is best: you can
    // individually place each button exactly where you want it.
    if (index == 1) {
        // set up background and music
        jl.setMusic("tune.ogg");
        jl.world.drawPicture({ x: 0, y: 0, width: 16, height: 9, img: "chooser.png" });

        // We'll have margins of 1.25 on the left and right, a margin of 1 on
        // the bottom, and three rows of eight buttons each, with each button
        // 1.25x1.25 meters, and .5 meters between them
        drawLevelButton(jl, 1.25, 3.25, 1.25, 1.25, 1);
        drawLevelButton(jl, 3.00, 3.25, 1.25, 1.25, 2);
        drawLevelButton(jl, 4.75, 3.25, 1.25, 1.25, 3);
        drawLevelButton(jl, 6.50, 3.25, 1.25, 1.25, 4);
        drawLevelButton(jl, 8.25, 3.25, 1.25, 1.25, 5);
        drawLevelButton(jl, 10.00, 3.25, 1.25, 1.25, 6);
        drawLevelButton(jl, 11.75, 3.25, 1.25, 1.25, 7);
        drawLevelButton(jl, 13.50, 3.25, 1.25, 1.25, 8);

        drawLevelButton(jl, 1.25, 5, 1.25, 1.25, 9);
        drawLevelButton(jl, 3.00, 5, 1.25, 1.25, 10);
        drawLevelButton(jl, 4.75, 5, 1.25, 1.25, 11);
        drawLevelButton(jl, 6.50, 5, 1.25, 1.25, 12);
        drawLevelButton(jl, 8.25, 5, 1.25, 1.25, 13);
        drawLevelButton(jl, 10.00, 5, 1.25, 1.25, 14);
        drawLevelButton(jl, 11.75, 5, 1.25, 1.25, 15);
        drawLevelButton(jl, 13.50, 5, 1.25, 1.25, 16);

        drawLevelButton(jl, 1.25, 6.75, 1.25, 1.25, 17);
        drawLevelButton(jl, 3.00, 6.75, 1.25, 1.25, 18);
        drawLevelButton(jl, 4.75, 6.75, 1.25, 1.25, 19);
        drawLevelButton(jl, 6.50, 6.75, 1.25, 1.25, 20);
        drawLevelButton(jl, 8.25, 6.75, 1.25, 1.25, 21);
        drawLevelButton(jl, 10.00, 6.75, 1.25, 1.25, 22);
        drawLevelButton(jl, 11.75, 6.75, 1.25, 1.25, 23);
        drawLevelButton(jl, 13.50, 6.75, 1.25, 1.25, 24);

        // draw the navigation buttons
        drawNextButton(jl, 15, 5.125, 1, 1, 2);
        drawSplashButton(jl, 15, 8, 1, 1);
    }

    else {
        // set up background and music
        jl.setMusic("tune.ogg");
        jl.world.drawPicture({ x: 0, y: 0, width: 16, height: 9, img: "chooser.png" });
        for (let row = 0, y = 3.25, l = 24 * (index - 1) + 1; row < 3; ++row, y += 1.75) {
            let x = 1.25;
            for (let i = 0; i < 8; ++i, ++l, x += 1.75) {
                // Only draw a button if we're less than or equal to 90, since
                // that's our last level
                if (l <= 92)
                    drawLevelButton(jl, x, y, 1.25, 1.25, l);
            }
        }
        // draw the navigation buttons
        if (index < 4)
            drawNextButton(jl, 15, 5.125, 1, 1, index + 1);
        drawPrevButton(jl, 0, 5.125, 1, 1, index - 1);
        drawSplashButton(jl, 15, 8, 1, 1);
    }
}

/**
 * This is a helper function for drawing a level button. If the level is
 * locked, the button isn't playable. Otherwise, the player can tap the
 * button to start a level.
 *
 * @param x      X coordinate of the top left corner of the button
 * @param y      Y coordinate of the top left corner of the button
 * @param width  width of the button
 * @param height height of the button
 * @param whichLevel  which level to play when the button is tapped
 */
function drawLevelButton(jl: JetLagApi, x: number, y: number, width: number, height: number, whichLevel: number): void {
    // for each button, start by drawing an obstacle
    let tile = jl.world.makeObstacle({ box: true, x: x, y: y, width: width, height: height, img: "leveltile.png" });

    // attach a callback and print the level number with a touchCallback, and then put text on top of it
    tile.setTapHandler(() => { jl.nav.doLevel(whichLevel); return true; });
    jl.world.addText({ center: true, x: x + width / 2, y: y + width / 2, face: "Arial", color: "#FFFFFF", size: 56, producer: () => { return whichLevel + "" }, z: 0 });
}

/**
 * This helper function is for drawing the button that takes us to the previous chooser screen
 *
 * @param x            X coordinate of top left corner of the button
 * @param y            Y coordinate of top left corner of the button
 * @param width        width of the button
 * @param height       height of the button
 * @param chooserLevel The chooser screen to create
 */
function drawPrevButton(jl: JetLagApi, x: number, y: number, width: number, height: number, chooserLevel: number) {
    let btn = jl.world.makeObstacle({ box: true, x: x, y: y, width: width, height: height, img: "leftarrow.png" });
    btn.setTapHandler(() => { jl.nav.doChooser(chooserLevel); return true; });
}

/**
 * This helper function is for drawing the button that takes us to the next chooser screen
 *
 * @param x            X coordinate of top left corner of the button
 * @param y            Y coordinate of top left corner of the button
 * @param width        width of the button
 * @param height       height of the button
 * @param chooserLevel The chooser screen to create
 */
function drawNextButton(jl: JetLagApi, x: number, y: number, width: number, height: number, chooserLevel: number) {
    let btn = jl.world.makeObstacle({ box: true, x: x, y: y, width: width, height: height, img: "rightarrow.png" });
    btn.setTapHandler(() => { jl.nav.doChooser(chooserLevel); return true; });
}

/**
 * This helper function is for drawing the button that takes us back to the splash screen
 *
 * @param x      X coordinate of top left corner of the button
 * @param y      Y coordinate of top left corner of the button
 * @param width  width of the button
 * @param height height of the button
 */
function drawSplashButton(jl: JetLagApi, x: number, y: number, width: number, height: number) {
    let btn = jl.world.makeObstacle({ box: true, x: x, y: y, width: width, height: height, img: "backarrow.png" });
    btn.setTapHandler(() => { jl.nav.doSplash(1); return true; });
}
