import { JetLagProcess } from "../support/Interfaces";

/** HtmlProcess provides exit functionality by closing the window. */
export class HtmlProcess implements JetLagProcess {
    /** Close the window to exit the game */
    public exit() { window.close(); }
}