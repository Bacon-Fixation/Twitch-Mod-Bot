import humanize from "humanize-duration";

const alphabetBasic: any = {
  a: "4",
  b: "8",
  e: "3",
  f: "ph",
  g: "6", // or 9
  i: "1", // or |
  o: "0",
  s: "5",
  t: "7", // or +
};

const alphabetAdvanced: any = {
  c: "(", // or k or |< or /<
  d: "<|",
  h: "|-|",
  k: "|<", // or /<
  l: "|", // or 1
  m: "|\\/|",
  n: "|\\|",
  p: "|2",
  u: "|_|",
  v: "/", // or \/
  w: "//", // or \/\/
  x: "><",
  y: "'/",
};

const alphabetReversed: Array<[RegExp, string]> = [
  [/(\|\\\/\|)/g, "m"],
  [/(\|\\\|)/g, "n"],
  [/(\()/g, "c"],
  [/(<\|)/g, "d"],
  [/\|-\|/g, "h"],
  [/(\|<)/g, "k"],
  [/(\|2)/g, "p"],
  [/(\|_\|)/g, "u"],
  [/(\/\/)/g, "w"],
  [/(><)/g, "x"],
  [/(\|)/g, "l"],
  [/(\'\/)/g, "y"],
  [/(\/)/g, "v"],
  [/(1)/g, "i"],
  [/(0)/g, "o"],
  [/(3)/g, "e"],
  [/(4)/g, "a"],
  [/(5)/g, "s"],
  [/(6)/g, "g"],
  [/(7)/g, "t"],
  [/(8)/g, "b"],
  [/(ph)/g, "f"],
];

// Convert input into l33t
export const convertTextToLeet = (text: string, useAdvanced = "n") => {
  for (let i = 0; i < text.length; i++) {
    let alphabet: any;
    let letter = text[i].toLowerCase();

    if (useAdvanced.toLowerCase() === "y") {
      // Use advanced l33t speak alphabet
      alphabet = alphabetBasic[letter]
        ? alphabetBasic[letter]
        : alphabetAdvanced[letter];
    } else {
      // Use basic l33t speak alphabet
      alphabet = alphabetBasic[letter];
    }

    if (alphabet) {
      text = text.replace(text[i], alphabet);
    }
  }

  return text;
};

export const convertLeetToText = (text: string) => {
  text = text.toLowerCase();

  alphabetReversed.map((x) => {
    text = text.replace(x[0], x[1]);
  });

  return text;
};

// Humanize
const shortHumanize = humanize.humanizer({
  language: "shortEn",
  languages: {
    shortEn: {
      y: () => "y",
      mo: () => "mo",
      w: () => "w",
      d: () => "d",
      h: () => "h",
      m: () => "m",
      s: () => "s",
      ms: () => "ms",
    },
  },
});

export const formatNumber = (num: any) => {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

exports.humanize = (date: any, converted: any) => {
  let ms = date;
  if (!converted) ms = Date.now() - Date.parse(date);
  const options: any = {
    units: ["y", "mo", "d", "h", "m", "s"],
    largest: 3,
    round: true,
    delimiter: " ",
    spacer: "",
  };
  return shortHumanize(ms, options);
};

export const humanizeMS = (ms: any) => {
  const options: any = {
    units: ["y", "d", "h", "m", "s"],
    largest: 3,
    round: true,
    delimiter: " ",
    spacer: "",
  };
  return shortHumanize(ms, options);
};

export const humanizeNumbers = (number: number) => {
  if (number % 100 >= 11 && number % 100 <= 13) return number + "th";

  switch (number % 10) {
    case 1:
      return number + "st";
    case 2:
      return number + "nd";
    case 3:
      return number + "rd";
  }

  return number + "th";
};
// Humanize End

export const fitText = (text: string, maxLength: number) => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const randArray = (array: any[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

export const addFullStop = (str: string) => {
  return str.replace(/ /g, ".");
};

export const removeSpace = (str: string) => {
  return str.replace(/\s+/g, "");
};

export const removeUnderscore = (str: string) => {
  return str.replace(/_+/g, "");
};
export const removeDash = (str: string) => {
  return str.replace(/-+/g, "");
};
// Filtering End

// Sanitizing
export const sanitize = (str: string) => {
  return str.replace(/[^a-zA-Z0-9]/g, "");
};

export const keepUnicode = (str: string) => {
  return str.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "");
};

export const keepSpace = (str: string) => {
  let str2 = str.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "");
  return str2.replace(/ /g, " ");
};

export const addFullstop = (str: string) => {
  let str2 = str.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "");
  return str2.replace(/ /g, ".");
};

export const addUnderscore = (str: string) => {
  let str2 = str.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "");
  return str2.replace(/ /g, "_");
};

export const addDash = (str: string) => {
  let str2 = str.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "");
  return str2.replace(/ /g, "-");
};

export const removeNumber = (str: string) => {
  return str.replace(/[^a-zA-Z]/g, "");
};

export const removeText = (str: string) => {
  return str.replace(/[^0-9]/g, "");
};

export const keepNumber = (str: string) => {
  return str.replace(/[^a-zA-Z0-9]/g, "");
};
// Sanitizing End
const characterMap: any = {
  À: "A",
  Á: "A",
  Â: "A",
  Ã: "A",
  Ä: "A",
  Å: "A",
  Ấ: "A",
  Ắ: "A",
  Ẳ: "A",
  Ẵ: "A",
  Ặ: "A",
  Æ: "AE",
  Ầ: "A",
  Ằ: "A",
  Ȃ: "A",
  Ç: "C",
  Ḉ: "C",
  È: "E",
  É: "E",
  Ê: "E",
  Ë: "E",
  Ế: "E",
  Ḗ: "E",
  Ề: "E",
  Ḕ: "E",
  Ḝ: "E",
  Ȇ: "E",
  Ì: "I",
  Í: "I",
  Î: "I",
  Ï: "I",
  Ḯ: "I",
  Ȋ: "I",
  Ð: "D",
  Ñ: "N",
  Ò: "O",
  Ó: "O",
  Ô: "O",
  Õ: "O",
  Ö: "O",
  Ø: "O",
  Ố: "O",
  Ṍ: "O",
  Ṓ: "O",
  Ȏ: "O",
  Ù: "U",
  Ú: "U",
  Û: "U",
  Ü: "U",
  Ý: "Y",
  à: "a",
  á: "a",
  â: "a",
  ã: "a",
  ä: "a",
  å: "a",
  ấ: "a",
  ắ: "a",
  ẳ: "a",
  ẵ: "a",
  ặ: "a",
  æ: "ae",
  ầ: "a",
  ằ: "a",
  ȃ: "a",
  ç: "c",
  ḉ: "c",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ế: "e",
  ḗ: "e",
  ề: "e",
  ḕ: "e",
  ḝ: "e",
  ȇ: "e",
  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  ḯ: "i",
  ȋ: "i",
  ð: "d",
  ñ: "n",
  ò: "o",
  ó: "o",
  ô: "o",
  õ: "o",
  ö: "o",
  ø: "o",
  ố: "o",
  ṍ: "o",
  ṓ: "o",
  ȏ: "o",
  ù: "u",
  ú: "u",
  û: "u",
  ü: "u",
  ý: "y",
  ÿ: "y",
  Ā: "A",
  ā: "a",
  Ă: "A",
  ă: "a",
  Ą: "A",
  ą: "a",
  Ć: "C",
  ć: "c",
  Ĉ: "C",
  ĉ: "c",
  Ċ: "C",
  ċ: "c",
  Č: "C",
  č: "c",
  C̆: "C",
  c̆: "c",
  Ď: "D",
  ď: "d",
  Đ: "D",
  đ: "d",
  Ē: "E",
  ē: "e",
  Ĕ: "E",
  ĕ: "e",
  Ė: "E",
  ė: "e",
  Ę: "E",
  ę: "e",
  Ě: "E",
  ě: "e",
  Ĝ: "G",
  Ǵ: "G",
  ĝ: "g",
  ǵ: "g",
  Ğ: "G",
  ğ: "g",
  Ġ: "G",
  ġ: "g",
  Ģ: "G",
  ģ: "g",
  Ĥ: "H",
  ĥ: "h",
  Ħ: "H",
  ħ: "h",
  Ḫ: "H",
  ḫ: "h",
  Ĩ: "I",
  ĩ: "i",
  Ī: "I",
  ī: "i",
  Ĭ: "I",
  ĭ: "i",
  Į: "I",
  į: "i",
  İ: "I",
  ı: "i",
  Ĳ: "IJ",
  ĳ: "ij",
  Ĵ: "J",
  ĵ: "j",
  Ķ: "K",
  ķ: "k",
  Ḱ: "K",
  ḱ: "k",
  K̆: "K",
  k̆: "k",
  Ĺ: "L",
  ĺ: "l",
  Ļ: "L",
  ļ: "l",
  Ľ: "L",
  ľ: "l",
  Ŀ: "L",
  ŀ: "l",
  Ł: "l",
  ł: "l",
  Ḿ: "M",
  ḿ: "m",
  M̆: "M",
  m̆: "m",
  Ń: "N",
  ń: "n",
  Ņ: "N",
  ņ: "n",
  Ň: "N",
  ň: "n",
  ŉ: "n",
  N̆: "N",
  n̆: "n",
  Ō: "O",
  ō: "o",
  Ŏ: "O",
  ŏ: "o",
  Ő: "O",
  ő: "o",
  Œ: "OE",
  œ: "oe",
  P̆: "P",
  p̆: "p",
  Ŕ: "R",
  ŕ: "r",
  Ŗ: "R",
  ŗ: "r",
  Ř: "R",
  ř: "r",
  R̆: "R",
  r̆: "r",
  Ȓ: "R",
  ȓ: "r",
  Ś: "S",
  ś: "s",
  Ŝ: "S",
  ŝ: "s",
  Ş: "S",
  Ș: "S",
  ș: "s",
  ş: "s",
  Š: "S",
  š: "s",
  ß: "ss",
  Ţ: "T",
  ţ: "t",
  ț: "t",
  Ț: "T",
  Ť: "T",
  ť: "t",
  Ŧ: "T",
  ŧ: "t",
  T̆: "T",
  t̆: "t",
  Ũ: "U",
  ũ: "u",
  Ū: "U",
  ū: "u",
  Ŭ: "U",
  ŭ: "u",
  Ů: "U",
  ů: "u",
  Ű: "U",
  ű: "u",
  Ų: "U",
  ų: "u",
  Ȗ: "U",
  ȗ: "u",
  V̆: "V",
  v̆: "v",
  Ŵ: "W",
  ŵ: "w",
  Ẃ: "W",
  ẃ: "w",
  X̆: "X",
  x̆: "x",
  Ŷ: "Y",
  ŷ: "y",
  Ÿ: "Y",
  Y̆: "Y",
  y̆: "y",
  Ź: "Z",
  ź: "z",
  Ż: "Z",
  ż: "z",
  Ž: "Z",
  ž: "z",
  ſ: "s",
  ƒ: "f",
  Ơ: "O",
  ơ: "o",
  Ư: "U",
  ư: "u",
  Ǎ: "A",
  ǎ: "a",
  Ǐ: "I",
  ǐ: "i",
  Ǒ: "O",
  ǒ: "o",
  Ǔ: "U",
  ǔ: "u",
  Ǖ: "U",
  ǖ: "u",
  Ǘ: "U",
  ǘ: "u",
  Ǚ: "U",
  ǚ: "u",
  Ǜ: "U",
  ǜ: "u",
  Ứ: "U",
  ứ: "u",
  Ṹ: "U",
  ṹ: "u",
  Ǻ: "A",
  ǻ: "a",
  Ǽ: "AE",
  ǽ: "ae",
  Ǿ: "O",
  ǿ: "o",
  Þ: "TH",
  þ: "th",
  Ṕ: "P",
  ṕ: "p",
  Ṥ: "S",
  ṥ: "s",
  X́: "X",
  x́: "x",
  Ѓ: "Г",
  ѓ: "г",
  Ќ: "К",
  ќ: "к",
  A̋: "A",
  a̋: "a",
  E̋: "E",
  e̋: "e",
  I̋: "I",
  i̋: "i",
  Ǹ: "N",
  ǹ: "n",
  Ồ: "O",
  ồ: "o",
  Ṑ: "O",
  ṑ: "o",
  Ừ: "U",
  ừ: "u",
  Ẁ: "W",
  ẁ: "w",
  Ỳ: "Y",
  ỳ: "y",
  Ȁ: "A",
  ȁ: "a",
  Ȅ: "E",
  ȅ: "e",
  Ȉ: "I",
  ȉ: "i",
  Ȍ: "O",
  ȍ: "o",
  Ȑ: "R",
  ȑ: "r",
  Ȕ: "U",
  ȕ: "u",
  B̌: "B",
  b̌: "b",
  Č̣: "C",
  č̣: "c",
  Ê̌: "E",
  ê̌: "e",
  F̌: "F",
  f̌: "f",
  Ǧ: "G",
  ǧ: "g",
  Ȟ: "H",
  ȟ: "h",
  J̌: "J",
  ǰ: "j",
  Ǩ: "K",
  ǩ: "k",
  M̌: "M",
  m̌: "m",
  P̌: "P",
  p̌: "p",
  Q̌: "Q",
  q̌: "q",
  Ř̩: "R",
  ř̩: "r",
  Ṧ: "S",
  ṧ: "s",
  V̌: "V",
  v̌: "v",
  W̌: "W",
  w̌: "w",
  X̌: "X",
  x̌: "x",
  Y̌: "Y",
  y̌: "y",
  A̧: "A",
  a̧: "a",
  B̧: "B",
  b̧: "b",
  Ḑ: "D",
  ḑ: "d",
  Ȩ: "E",
  ȩ: "e",
  Ɛ̧: "E",
  ɛ̧: "e",
  Ḩ: "H",
  ḩ: "h",
  I̧: "I",
  i̧: "i",
  Ɨ̧: "I",
  ɨ̧: "i",
  M̧: "M",
  m̧: "m",
  O̧: "O",
  o̧: "o",
  Q̧: "Q",
  q̧: "q",
  U̧: "U",
  u̧: "u",
  X̧: "X",
  x̧: "x",
  Z̧: "Z",
  z̧: "z",
  й: "и",
  Й: "И",
  ё: "е",
  Ё: "Е",
};

const chars = Object.keys(characterMap).join("|");
const allAccents = new RegExp(chars, "g");
const firstAccent = new RegExp(chars, "");

function matcher(match: any) {
  return characterMap[match];
}

export const removeAccents = function (string: string) {
  return string.replace(allAccents, matcher);
};

export const hasAccents = function (string: string) {
  return !!string.match(firstAccent);
};

export const hasNumber = function (string: string) {
  return /\d/g.test(string);
};

export const removeFromArray = function (array: any[], value: string | number) {
  return array.filter((item) => {
    return item != value;
  });
};
