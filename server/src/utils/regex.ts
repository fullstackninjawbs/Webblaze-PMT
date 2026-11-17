/**
 * Escapes user input for use inside a RegExp. Without this, a search like "(" throws
 * (500 error) and patterns like "(a+)+$" can stall the database (ReDoS).
 */
export const escapeRegex = (value: unknown): string =>
  String(value ?? '').slice(0, 200).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Case-insensitive "contains" regex built safely from user input. */
export const containsRegex = (value: unknown): RegExp => new RegExp(escapeRegex(value), 'i');
