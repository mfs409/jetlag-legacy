/**
 * Process abstracts away what it means to be a process in the given execution
 * environment, so that we can handle quit requests in a device-agnostic way.
 */
export class JetLagProcess {
    /**
     * Exit the current process, terminate the app, close the window, or
     * whatever else it might mean to exit.
     */
    public exit() {
        window.close();
    }
}