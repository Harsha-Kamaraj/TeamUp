/**
 * Escape user input before embedding it in a RegExp.
 *
 * Without this, a search for "a.*" or "(((" becomes a pattern the user
 * controls — at best matching everything, at worst hanging the query.
 */
export default function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
