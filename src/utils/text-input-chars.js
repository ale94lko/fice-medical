/**
 * Shared letter classes for free-text fields that allow letters.
 * Uses Unicode `\p{L}` so Spanish ñ/Ñ and accented letters are accepted.
 */

/** Letters-only field (names, city-like text): letters + spaces. */
export const LETTERS_AND_SPACES_RE = /^[\p{L}\s]+$/u

/** Same class for sanitizing while typing (strip disallowed chars). */
export const NON_LETTERS_OR_SPACES_RE = /[^\p{L}\s]/gu

/** Address lines: letters, digits, period, hyphen, spaces. */
export const ADDRESS_LINE_RE = /^[\p{L}0-9.\-\s]*$/u

/** Optional letters-only (empty allowed via *). */
export const OPTIONAL_LETTERS_AND_SPACES_RE = /^[\p{L}\s]*$/u

/** Allergy name: letters, digits, spaces, and - ( ) " '. */
export const ALLERGY_NAME_RE = /^[\p{L}0-9\s\-()"']*$/u

/** FMH medical conditions: letters, digits, spaces, and . , ' ( ) / -. */
export const MEDICAL_CONDITIONS_RE = /^[\p{L}0-9\s.,'()/-]*$/u
