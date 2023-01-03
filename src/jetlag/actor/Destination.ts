import { WorldActor } from "./WorldActor"
import { Hero } from "./Hero"
import { JetLagSound } from "../internal/support/Interfaces";
import { JetLagStage } from "../internal/JetLagStage";
import { b2Contact } from "@box2d/core";

/**
 * Destinations are actors that the Hero should try to reach. When a Hero
 * reaches a destination, the Hero disappears, and the score updates.
 */
export class Destination extends WorldActor {
    /** the number of heroes who can fit at /this/ destination */
    private capacity: number;

    /** the number of heroes already in /this/ destination */
    private holding: number;

    /** Sound to play when a hero arrives at this destination */
    private arrivalSound?: JetLagSound;

    /** 
     * A custom, optional check to decide if the Destination is "ready" to
     * accept a Hero 
     */
    private onAttemptArrival?: (h: Hero) => boolean;

    /**
     * Create a basic Destination.  The destination won't yet have any physics
     * attached to it.
     *
     * @param stage The stage into which the Destination is being placed
     * @param width The width, in meters, of the Destination
     * @param height The height, in meters, of the Destination
     * @param imgName The image to display for this destination
     * @param z The z index of the Destination
     */
    constructor(stage: JetLagStage, width: number, height: number, imgName: string, z: number) {
        super(stage, imgName, width, height, z);
        this.capacity = 1;
        this.holding = 0;
    }

    /**
     *  Return the code that should be run when a hero tries to arrive at this
     *  destination
     */
    public getOnAttemptArrival() { return this.onAttemptArrival; }

    /**
     * Provide code that should run when the hero tries to reach this
     * destination.  If the code returns /true/, the hero will be allowed in.
     * Otherwise, it won't.
     *
     * @param callback The code to run to decide if the hero should be let in
     */
    public setOnAttemptArrival(callback: (h: Hero) => boolean) {
        this.onAttemptArrival = callback;
    }

    /**
     * Decide if a hero can be received by the destination.  This allows us to
     * both (a) encapsulate the enforcement of capacity, and (b) afford the
     * programmer an opportunity to run custom logic (such as goodie count
     * tests) before allowing a hero in
     * 
     * @param h The hero who may be received by this destination
     */
    public receive(h: Hero) {
        // capacity check
        if (this.holding >= this.capacity)
            return false;
        // custom tests?
        if (this.onAttemptArrival)
            if (!this.onAttemptArrival(h))
                return false;
        // it's allowed in... play a sound
        this.holding++;
        if (this.arrivalSound)
            this.arrivalSound.play();
        return true;
    }

    /**
     * Code to run when a Destination collides with a WorldActor.
     * 
     * NB: Destinations are toward the end of the collision hierarchy, so we
     *     don't do anything when they are in a collision that hasn't already
     *     been handled by a higher-ranked WorldActor.
     *
     * @param other   Other actor involved in this collision
     * @param contact A description of the collision
     */
    onCollide(_other: WorldActor, _contact: b2Contact) { }

    /**
     * Change the number of heroes that can be accepted by this destination (the
     * default is 1)
     *
     * @param heroes The number of heroes that can be accepted
     */
    public setCapacity(heroes: number) { this.capacity = heroes; }

    /**
     * Specify the sound to play when a hero arrives at this destination
     *
     * @param soundName The name of the sound file that should play
     */
    public setArrivalSound(soundName: string) {
        this.arrivalSound = this.stage.device.getSpeaker().getSound(soundName);
    }
}