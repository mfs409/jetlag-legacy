// TODO:  Capacitor and Electron will need to use plugins for persistence.
//        Supporting that will likely introduce a need for some kind of
//        compile-time switch to pick the right persistence?

/**
 * StorageService provides three key/value stores
 *
 * - Persistent: Things saved here will remain here, even after the player
 *               leaves the page.  This currently uses the HTML5 persistent
 *               storage API.
 * - Session:    Things saved here will remain as the player moves among levels,
 *               but will be discarded when the player exits/refreshes the
 *               browser.
 * - Level:      Things saved here will remain only until the player moves to
 *               another level.
 *
 * Note that Session and Level can story any data type.  Persistent can only
 * store strings, so you'll need JSON serialization for fancy stuff.
 */
export class StorageService {
  /** The "session" storage */
  private readonly sessionFacts: { [index: string]: any } = {};

  /** The "level" storage */
  private levelFacts: { [index: string]: any } = {};

  /** Clear the level storage */
  public clearLevelStorage() { this.levelFacts = {}; }

  /**
   * Save something to the level storage
   *
   * @param key   The key by which to remember the data being saved
   * @param value The value to store with the provided key
   */
  public setLevel(key: string, value: any) { this.levelFacts[key] = value; }

  /**
   * Look up a value from the level storage
   *
   * @param key The key with which the value was previously saved
   */
  public getLevel(key: string) { return this.levelFacts[key]; }

  /**
   * Save something to the session storage
   *
   * @param key   The key by which to remember the data being saved
   * @param value The value to store with the provided key
   */
  public setSession(key: string, value: any) { this.sessionFacts[key] = value; }

  /**
   * Look up a value from the session storage
   *
   * @param key The key with which the value was previously saved
   */
  public getSession(key: string) { return this.sessionFacts[key]; }

  /**
   * Save something to the persistent storage
   *
   * @param key   The key by which to remember the data being saved
   * @param value The value to store with the provided key
   */
  public setPersistent(key: string, value: string) { localStorage.setItem(key, value); }

  /**
   * Look up a value from the persistent storage
   *
   * @param key The key with which the value was previously saved
   */
  public getPersistent(key: string) {
    let res = localStorage.getItem(key);
    return (res == null) ? undefined : res;
  }
}
