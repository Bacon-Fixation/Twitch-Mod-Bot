import humanize from 'humanize-duration';
import { TwitchBot } from '../../extendedClient';
import Logger from './logger';
import { MessageData } from './twitchAPI-types';

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
  ??: "A",
  ??: "A",
  ??: "A",
  ??: "A",
  ??: "A",
  ??: "A",
  ???: "A",
  ???: "A",
  ???: "A",
  ???: "A",
  ???: "A",
  ??: "AE",
  ???: "A",
  ???: "A",
  ??: "A",
  ??: "C",
  ???: "C",
  ??: "E",
  ??: "E",
  ??: "E",
  ??: "E",
  ???: "E",
  ???: "E",
  ???: "E",
  ???: "E",
  ???: "E",
  ??: "E",
  ??: "I",
  ??: "I",
  ??: "I",
  ??: "I",
  ???: "I",
  ??: "I",
  ??: "D",
  ??: "N",
  ??: "O",
  ??: "O",
  ??: "O",
  ??: "O",
  ??: "O",
  ??: "O",
  ???: "O",
  ???: "O",
  ???: "O",
  ??: "O",
  ??: "U",
  ??: "U",
  ??: "U",
  ??: "U",
  ??: "Y",
  ??: "a",
  ??: "a",
  ??: "a",
  ??: "a",
  ??: "a",
  ??: "a",
  ???: "a",
  ???: "a",
  ???: "a",
  ???: "a",
  ???: "a",
  ??: "ae",
  ???: "a",
  ???: "a",
  ??: "a",
  ??: "c",
  ???: "c",
  ??: "e",
  ??: "e",
  ??: "e",
  ??: "e",
  ???: "e",
  ???: "e",
  ???: "e",
  ???: "e",
  ???: "e",
  ??: "e",
  ??: "i",
  ??: "i",
  ??: "i",
  ??: "i",
  ???: "i",
  ??: "i",
  ??: "d",
  ??: "n",
  ??: "o",
  ??: "o",
  ??: "o",
  ??: "o",
  ??: "o",
  ??: "o",
  ???: "o",
  ???: "o",
  ???: "o",
  ??: "o",
  ??: "u",
  ??: "u",
  ??: "u",
  ??: "u",
  ??: "y",
  ??: "y",
  ??: "A",
  ??: "a",
  ??: "A",
  ??: "a",
  ??: "A",
  ??: "a",
  ??: "C",
  ??: "c",
  ??: "C",
  ??: "c",
  ??: "C",
  ??: "c",
  ??: "C",
  ??: "c",
  C??: "C",
  c??: "c",
  ??: "D",
  ??: "d",
  ??: "D",
  ??: "d",
  ??: "E",
  ??: "e",
  ??: "E",
  ??: "e",
  ??: "E",
  ??: "e",
  ??: "E",
  ??: "e",
  ??: "E",
  ??: "e",
  ??: "G",
  ??: "G",
  ??: "g",
  ??: "g",
  ??: "G",
  ??: "g",
  ??: "G",
  ??: "g",
  ??: "G",
  ??: "g",
  ??: "H",
  ??: "h",
  ??: "H",
  ??: "h",
  ???: "H",
  ???: "h",
  ??: "I",
  ??: "i",
  ??: "I",
  ??: "i",
  ??: "I",
  ??: "i",
  ??: "I",
  ??: "i",
  ??: "I",
  ??: "i",
  ??: "IJ",
  ??: "ij",
  ??: "J",
  ??: "j",
  ??: "K",
  ??: "k",
  ???: "K",
  ???: "k",
  K??: "K",
  k??: "k",
  ??: "L",
  ??: "l",
  ??: "L",
  ??: "l",
  ??: "L",
  ??: "l",
  ??: "L",
  ??: "l",
  ??: "l",
  ??: "l",
  ???: "M",
  ???: "m",
  M??: "M",
  m??: "m",
  ??: "N",
  ??: "n",
  ??: "N",
  ??: "n",
  ??: "N",
  ??: "n",
  ??: "n",
  N??: "N",
  n??: "n",
  ??: "O",
  ??: "o",
  ??: "O",
  ??: "o",
  ??: "O",
  ??: "o",
  ??: "OE",
  ??: "oe",
  P??: "P",
  p??: "p",
  ??: "R",
  ??: "r",
  ??: "R",
  ??: "r",
  ??: "R",
  ??: "r",
  R??: "R",
  r??: "r",
  ??: "R",
  ??: "r",
  ??: "S",
  ??: "s",
  ??: "S",
  ??: "s",
  ??: "S",
  ??: "S",
  ??: "s",
  ??: "s",
  ??: "S",
  ??: "s",
  ??: "ss",
  ??: "T",
  ??: "t",
  ??: "t",
  ??: "T",
  ??: "T",
  ??: "t",
  ??: "T",
  ??: "t",
  T??: "T",
  t??: "t",
  ??: "U",
  ??: "u",
  ??: "U",
  ??: "u",
  ??: "U",
  ??: "u",
  ??: "U",
  ??: "u",
  ??: "U",
  ??: "u",
  ??: "U",
  ??: "u",
  ??: "U",
  ??: "u",
  V??: "V",
  v??: "v",
  ??: "W",
  ??: "w",
  ???: "W",
  ???: "w",
  X??: "X",
  x??: "x",
  ??: "Y",
  ??: "y",
  ??: "Y",
  Y??: "Y",
  y??: "y",
  ??: "Z",
  ??: "z",
  ??: "Z",
  ??: "z",
  ??: "Z",
  ??: "z",
  ??: "s",
  ??: "f",
  ??: "O",
  ??: "o",
  ??: "U",
  ??: "u",
  ??: "A",
  ??: "a",
  ??: "I",
  ??: "i",
  ??: "O",
  ??: "o",
  ??: "U",
  ??: "u",
  ??: "U",
  ??: "u",
  ??: "U",
  ??: "u",
  ??: "U",
  ??: "u",
  ??: "U",
  ??: "u",
  ???: "U",
  ???: "u",
  ???: "U",
  ???: "u",
  ??: "A",
  ??: "a",
  ??: "AE",
  ??: "ae",
  ??: "O",
  ??: "o",
  ??: "TH",
  ??: "th",
  ???: "P",
  ???: "p",
  ???: "S",
  ???: "s",
  X??: "X",
  x??: "x",
  ??: "??",
  ??: "??",
  ??: "??",
  ??: "??",
  A??: "A",
  a??: "a",
  E??: "E",
  e??: "e",
  I??: "I",
  i??: "i",
  ??: "N",
  ??: "n",
  ???: "O",
  ???: "o",
  ???: "O",
  ???: "o",
  ???: "U",
  ???: "u",
  ???: "W",
  ???: "w",
  ???: "Y",
  ???: "y",
  ??: "A",
  ??: "a",
  ??: "E",
  ??: "e",
  ??: "I",
  ??: "i",
  ??: "O",
  ??: "o",
  ??: "R",
  ??: "r",
  ??: "U",
  ??: "u",
  B??: "B",
  b??: "b",
  ????: "C",
  ????: "c",
  ????: "E",
  ????: "e",
  F??: "F",
  f??: "f",
  ??: "G",
  ??: "g",
  ??: "H",
  ??: "h",
  J??: "J",
  ??: "j",
  ??: "K",
  ??: "k",
  M??: "M",
  m??: "m",
  P??: "P",
  p??: "p",
  Q??: "Q",
  q??: "q",
  ????: "R",
  ????: "r",
  ???: "S",
  ???: "s",
  V??: "V",
  v??: "v",
  W??: "W",
  w??: "w",
  X??: "X",
  x??: "x",
  Y??: "Y",
  y??: "y",
  A??: "A",
  a??: "a",
  B??: "B",
  b??: "b",
  ???: "D",
  ???: "d",
  ??: "E",
  ??: "e",
  ????: "E",
  ????: "e",
  ???: "H",
  ???: "h",
  I??: "I",
  i??: "i",
  ????: "I",
  ????: "i",
  M??: "M",
  m??: "m",
  O??: "O",
  o??: "o",
  Q??: "Q",
  q??: "q",
  U??: "U",
  u??: "u",
  X??: "X",
  x??: "x",
  Z??: "Z",
  z??: "z",
  ??: "??",
  ??: "??",
  ??: "??",
  ??: "??",
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

  async function isFollowBot(client: TwitchBot, msg: MessageData) {
    if (
      msg.user.perms.broadcaster ||
      msg.user.perms.mod ||
      msg.user.perms.vip ||
      msg.user.perms.owner ||
      msg.user.badges.length > 0
    )
      return;
    const timeStart = Date.now();
    Logger.info("Follow bot message an action: " + msg.isAction);
    Logger.info(
      `Follow Bot Triggered:(${msg.channel.login}) ${msg.user.name} | "${msg.text}"`
    );
    // Times-out Bots that are not subbed, mod, or broadcaster when trigger is detected
    if (
      (await client.twitch.api.isFollowedAPI({
        userID: msg.user.id,
        channelID: msg.channel.id,
        access_token: client.twitch.auth.api.access_token,
      })) == false
    ) {
      const reactionTime = `${Date.now() - timeStart}`;
      Logger.info(
        `Not Followed Bot Triggered:(${msg.channel.login}) ${msg.user.name} | "${msg.text} - ${reactionTime}ms"`
      );
      await client.deleteMsg(msg.channel.login, msg.messageID);
      await msg.send(
        `?????? Follow Bot - ${msg.user.name} message removed. - ${reactionTime}ms`
      );

      // await client.timeout(
      //   msg.channelName,
      //   msg.senderUsername,
      //   60,
      //   "Possible Follow Bot."
      // );
    }
    return;
  }