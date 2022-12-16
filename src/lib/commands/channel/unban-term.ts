import { getWordBank, modifyWordBank } from "../../utils/database";
import { TwitchBot } from "../../../extendedClient";
import { MessageData } from "../../utils/twitchAPI-types";

module.exports = {
  name: "unban-term",
  category: "channel",
  description: "Removes keyword from the Word Bank",
  botRequires: "mod",
  access: "mod",
  cooldown: 15,
  async execute(client: TwitchBot, msg: MessageData, utils: any) {
    if (!msg.args || msg.args.length == 0)
      return msg.send("❌ Please try again with a word.", true);
    const keyword = msg.args[0].toLowerCase().trim();
    if (client.twitch.wordBank.blocked.includes(keyword)) {
      await modifyWordBank(keyword, true, true);
      client.twitch.wordBank.blocked = [];
      await getWordBank(client);
      return msg.send(`✅ "${keyword}" was removed to the Word Bank.`, true);
    } else {
      return msg.send(`❌ "${keyword}" is not in the Word Bank.`, true);
    }
  },
};
