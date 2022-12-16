export const invisibleChars = new RegExp(
  /[\u034f\u2800\u{E0000}\u180e\ufeff\u2000-\u200d\u206D]/gu
);
export const racism = new RegExp(
  /(?:(?:\b(?<![-=\.])|monka)(?:[Nnñ]|[Ii7]V)|[\/|]\\[\/|])[\s\.]*?[liI1y!j\/|]+[\s\.]*?(?:[GgbB6934Q🅱qğĜƃ၅5\*][\s\.]*?){2,}(?!arcS|l|Ktlw|ylul|ie217|64|\d? ?times)/
);
export const accents = new RegExp(/[\u0300-\u036f]/g);
export const punctuation = new RegExp(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g);
export const URL = new RegExp(
  /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/
);
export const isUWU = new RegExp(
  // /\b(owo|uwu)\b/gi,
  /\b[oо0u🇴🇺]+[w🇼]+[oо0u🇴🇺]+\b/gi
  // /\b[oо0u🇴🇺]+[\s.,*_-`\\]*[w🇼]+[\s,.*_-`\\]*[oо0u🇴🇺]+/gi
);
//   trebekJoke: new RegExp(
//     /(you(r)?|mother(s|'s)?|mom(s|'s)?|last|night(s|'s)?|trebek(s|'s)?)/gi
//   ),
// countryCode: new RegExp(/^[a-z]{2}$/i),
export const uniEmote = new RegExp(
  /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g
);
