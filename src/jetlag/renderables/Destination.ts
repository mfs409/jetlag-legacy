import { WorldActor } from "./WorldActor"
import { JetLagManager } from "../JetLagManager"
import { WorldScene } from "../stage/WorldScene"
import { Hero } from "./Hero"

/**
 * Destinations are actors that the Hero should try to reach. When a Hero reaches a destination, the
 * Hero disappears, and the score updates.
 */
export class Destination extends WorldActor {
    /** the number of heroes who can fit at /this/ destination */
    private capacity: number;

    /** the number of heroes already in /this/ destination */
    private holding: number;

    /** Sound to play when a hero arrives at this destination */
    private arrivalSound: Howl;

    /** 
     * A custom, optional check to decide if the Destination is "ready" to
     * accept a Hero 
     */
    onAttemptArrival: (h: Hero) => boolean = null;

    /**
     * Create a basic Destination.  The destination won't yet have any physics attached to it.
     * 
     * @param manager The game-wide manager object
     * @param scene The scene into which the Destination is being placed
     * @param width The width, in meters, of the Destination
     * @param height The height, in meters, of the Destination
     * @param imgName The image to display for this destination
     */
    constructor(manager: JetLagManager, scene: WorldScene, width: number, height: number, imgName: string) {
        super(manager, scene, imgName, width, height);
        this.capacity = 1;
        this.holding = 0;
    }

    /**
     * Decide if a hero can be received by the destination.  This allows us to
     * both (a) encapsulate the enforcement of capacity, and (b) afford the
     * programmer an opportunity to run custom logic (such as goodie count
     * tests) before allowing a hero in
     * 
     * @param h The hero who may be received by this destination
     */
    public receive(h: Hero): boolean {
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
    onCollide(other: WorldActor, contact: PhysicsType2d.Dynamics.Contacts.Contact): void { }

    /**
     * Change the number of heroes that can be accepted by this destination (the
     * default is 1)
     *
     * @param heroes The number of heroes that can be accepted
     */
    public setCapacity(heroes: number): void {
        this.capacity = heroes;
    }

    /**
     * Specify the sound to play when a hero arrives at this destination
     *
     * @param soundName The name of the sound file that should play
     */
    public setArrivalSound(soundName: string): void {
        this.arrivalSound = this.stageManager.device.speaker.getSound(soundName);
    }
}