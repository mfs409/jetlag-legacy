import { JetLagApi as JetLagApi } from "../jetlag/api/JetLagApi";

/**
 * In games that have a store, there should be a button on the main screen (or
 * somewhere!) for going to the store.  Within the store, there may be many
 * different screens, corresponding to different sections of the store.
 * 
 * This code builds the screens of the store.  It is done the same way as any
 * other part of a game, but will probably make more extensive use of the
 * key/value storage to keep track of coins, inventories, etc.
 * 
 * Note: Our demo doesn't use a store, so this function doesn't do anything.
 *
 * @param index Which store screen should be displayed
 * @param jl    The JetLag object, for putting stuff into the level
 */
export function buildStoreScreen(index: number, jl: JetLagApi): void { }