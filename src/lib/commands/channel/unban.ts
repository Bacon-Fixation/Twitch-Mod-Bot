import { TwitchBot } from '../../../extendedClient';
// import { ClientCommandData } from "./../../../twitchAPI-types";
import { unBanUser } from '../../utils/database';
import Logger from '../../utils/logger';
import { MessageData } from '../../utils/twitchAPI-types';

module.exports = {
  name: "unban",
  category: "channel",
  description: "unBan a user from the channel",
  botRequires: "mod",
  access: "mod",
  cooldown: 15,
  async execute(client: TwitchBot, msg: MessageData, utils: any) {
    if (!msg.args || msg.args.length == 0)
      return msg.send("❌ Command needs a username", true);
    const user = msg.args[0].toLowerCase().replace("@", "");
    if (client.twitch.modded_users.includes(user))
      return msg.send(`❌ Can't ban a Moderator`, true);
    if (client.twitch.vip_users.includes(user))
      return msg.send(`❌ Can't ban a Vip`, true);
    let found = false;
    client.twitch.banned_users.map((person) => {
      if (person.login == user) {
        found = true;
      }
    });
    if (found) {
      await unBanUser(client, user, msg.channel.login)
        .then(
          async () => await msg.send(`✅ "${user}" has been Unbanned.`, true)
        )
        .catch(async (err) => {
          if (err.includes("moderator"))
            return msg.send(`❌ ${user} is a Moderator.`, true);
          return Logger.error(err);
        });

      return;
    } else {
      return msg.send(`❌ "${user}" has not been Banned.`, true);
    }
  },
};
