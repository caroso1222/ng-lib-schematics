export interface Schema {
  /**
   * The name of the library.
   */
  name: string;

  /**
   * The path of the app source directory.
   */
  sourceDir?: string;

  /**
   * The path of the library source directory.
   */
  path?: string;
}
