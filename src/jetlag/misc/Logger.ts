import { JetLagConsole } from "./JetLagDevice";

export class Logger {
    private static console: JetLagConsole;

    static urgent(message: string) { Logger.console.urgent(message); }
    static info(message: string) { Logger.console.info(message); }

    static config(console: JetLagConsole) { Logger.console = console; }

}