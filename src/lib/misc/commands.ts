import { TwitchBot } from "./../../extendedClient";
import path = require("path");
// import { client } from "../../server";

import fs from "fs";
// const { logger } = require("../utils/logger.js");

export function addCommand(client: TwitchBot, command: any) {
  if (!command.aliases) command.aliases = [];
  client.commands.set(command.name, command);
  client.categories.set(command.category, command.category);
  command.category == "basic"
    ? client?.categorizedCommands.basic.push(command.name)
    : null;
  command.category == "channel"
    ? client?.categorizedCommands.channel.push(command.name)
    : null;
  command.category == "utility"
    ? client?.categorizedCommands.utility.push(command.name)
    : null;

  for (const alias of command.aliases) {
    client.aliases.set(alias, command.name);
  }
}

export function deleteCommand(client: TwitchBot, command: any) {
  client?.commands.delete(command.name);
  const commandFile = require.resolve(
    `../commands/${command.category}/${command.name}.js`
  );
  if (commandFile) delete require.cache[commandFile];

  for (const alias of command.aliases) {
    client?.aliases.delete(alias);
  }
}

export function getCommand(client: TwitchBot, commandName) {
  return (
    client.commands.get(commandName) ||
    client.commands.get(client.aliases.get(commandName)!)
  );
}

export function loadCommands(client: TwitchBot) {
  const commandFiles = fs
    .readdirSync(path.join(__dirname, "../commands"))
    .map((folder) =>
      fs
        .readdirSync(`${path.join(__dirname, "../commands")}/${folder}`)
        .filter((file) => file.endsWith(".js"))
        .map((file) => `../commands/${folder}/${file}`)
    )
    .flat();

  for (const file of commandFiles) {
    const command = require(`${file}`);
    addCommand(client, command);
  }

  for (const category of Object.keys(client.categorizedCommands)) {
    client.commandsData[category] = [];

    for (const cmdName of client.categorizedCommands[category]) {
      const cmd = getCommand(client, cmdName);

      let badgeURL: string;
      switch (cmd.access) {
        case "mod":
          badgeURL =
            "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3";
          break;
        case "vip":
          badgeURL =
            "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3";
          break;
        case "bot-owner":
          badgeURL = "../static/bot_owner_36x36.jpeg";
          break;
        case "broadcaster":
          badgeURL =
            "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3";
          break;
        default: {
          badgeURL =
            "https://compass-ssl.xbox.com/assets/59/de/59de1b15-33b5-4a72-bff9-55b81625ef23.svg";
          break;
        }
      }

      client.commandsData[category].push({
        name: cmd.name,
        category: cmd.category,
        aliases: cmd.aliases,
        description: cmd.description,
        access: cmd.access,
        accessBadge: badgeURL,
        cooldown: cmd.cooldown,
        usage: cmd.usage,
        example: cmd.example,
      });
    }
  }
}
