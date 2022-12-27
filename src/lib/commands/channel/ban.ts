import { TwitchBot } from '../../../extendedClient';
import { banUser } from '../../utils/database';
import Logger from '../../utils/logger';
import { MessageData } from '../../utils/twitchAPI-types';

module.exports = {
  name: "ban",
  category: "channel",
  description: "Ban a user from the channel",
  botRequires: "mod",
  access: "mod",
  cooldown: 15,
  async execute(client: TwitchBot, msg: MessageData, utils: any) {
    if (!msg.args) return msg.send("❌ Command needs a username", true);
    const user = msg.args[0].toLowerCase().replace("@", "");
    if (client.twitch.modded_users.includes(user))
      return msg.send(`❌ Can't ban a moderator`, true);
    if (client.twitch.vip_users.includes(user))
      return msg.send(`❌ Can't ban a Vip`, true);
    let found = false;

    client.twitch.banned_users.map((person) => {
      if (person.login == user) {
        found = true;
        return;
      }
    });
    if (!found) {
      await banUser(
        client,
        user,
        msg.channel.login,
        msg.args.join(" ").replace(user, "").trim()
      )
        .then(async () => await msg.send(`✅ "${user}" has been banned`))
        .catch(async (err) => {
          return Logger.error(err);
        });

      return;
    } else {
      return msg.send(`❌ "${user}" has already been Banned.`, true);
    }
  },
};
