import { TwitchBot } from '../../../extendedClient';
import * as commands from '../../misc/commands';
import { MessageData } from '../../utils/twitchAPI-types';

module.exports = {
  name: "help",
  category: "basic",
  description: "Provides info about a specific command or brings you here",
  aliases: ["commands", "cmds"],
  usage: "<command-name> (Optional)",
  cooldown: 4,
  execute(client: TwitchBot, msg: MessageData, utils) {
    let text = `Available Commands: ${client.knownCommands.join(", ")}`;

    if (msg.args?.length) {
      const commandName = msg.args[0].toLowerCase();
      const command = commands.getCommand(client, commandName);

      if (command && client.knownCommands.includes(command.name)) {
        text = `${command.name}${
          command.aliases.length ? ` (${command.aliases.join(", ")})` : ""
        } - ${command.description}, Cooldown: ${
          command.cooldown ?? "0"
        }s, Access: ${command.access ?? `Everyone`}`;
      }
    }

    return msg.send(text, true);
  },
};
