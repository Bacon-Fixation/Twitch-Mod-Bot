import { TwitchBot } from '../../../extendedClient';
import { modifyWordBank } from '../../utils/database';
import { MessageData } from '../../utils/twitchAPI-types';

module.exports = {
  name: "ban-term",
  category: "channel",
  description:
    "Add a keyword to the Word Bank to remove chatters with inappropriate names.",
  botRequires: "mod",
  access: "mod",
  cooldown: 15,
  async execute(client: TwitchBot, msg: MessageData, utils: any) {
    if (!msg.args || msg.args.length == 0)
      return msg.send("❌ Please try again with a word.", true);
    const keyword = msg.args[0].toLowerCase().trim();
    if (!client.twitch.wordBank.blocked.includes(keyword)) {
      client.twitch.wordBank.blocked.push(keyword);
      await modifyWordBank(keyword, false, true);
      return msg.send(`✅ "${keyword}" was added to the Word Bank.`, true);
    } else {
      return msg.send(`❌ "${keyword}" already in the Word Bank.`, true);
    }
  },
};
