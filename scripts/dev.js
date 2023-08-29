import esbuildServe from "esbuild-serve";
import { SRC_ENTRY_FILE, DBG_BUNDLE_FILE } from './config.mjs';

// This script launches a "development" server that re-builds the program every
// time the code changes.  The server has a hot module replacement feature, so
// whenever the code changes, any browser displaying the page will auto-refresh.

esbuildServe({
    logLevel: "info",
    entryPoints: [SRC_ENTRY_FILE],
    bundle: true,
    outfile: DBG_BUNDLE_FILE,
    minify: false,
    sourcemap: true
}, { port: 7000 });
