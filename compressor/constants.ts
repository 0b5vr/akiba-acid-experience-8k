/** the number of bits we emit per output byte */
export const OUT_BITS = 8;

/** The width of the rANS state. */
export const ANS_BITS = 31;

export const OUT_SYMBOLS = 1 << OUT_BITS;
export const RENORM_LIMIT = 1 << (ANS_BITS - OUT_BITS);

/** the search never picks a selector wider than this, to keep the decoder's digits single */
export const SELECTOR_LIMIT = 512;

/** how many models the search is allowed to settle on */
export const MIN_MODELS = 4;
export const MAX_MODELS = 24;
