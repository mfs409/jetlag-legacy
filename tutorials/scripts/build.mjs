// NB:  All config and code for the npm scripts is in `common.mjs`.  The other
//      `.mjs` files, such as this, only serve as entry points to call from the
//      `scripts` section of `package.json`.

import { build_to_dist } from './common.mjs'
build_to_dist();