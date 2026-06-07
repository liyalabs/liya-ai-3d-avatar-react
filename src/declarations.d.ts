/**
 * CSS Module Type Declarations
 * Allows TypeScript to understand .css imports as side-effect imports
 */
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
