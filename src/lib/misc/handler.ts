import { TwitchBot } from "./../../extendedClient";
import { bot_settings } from "./../../server";
import { MessageData } from "../utils/twitchAPI-types";
import { invisibleChars } from "../utils/regex";
import * as commands from "../misc/commands";
import Logger from "../utils/logger";
import * as utils from "../utils/utils";
export async function commandHandler(client: TwitchBot, msg: MessageData) {
  if (msg.user.login !== bot_settings.bot_login) {
    msg.prefix = "^";
    msg.text = msg.text.replace(invisibleChars, "");
    msg.args = msg.text.slice(msg.prefix.length).trim().split(/ +/);
    msg.commandName = msg.args.shift()?.toLowerCase();
    msg.user.name =
      msg.user.name.toLowerCase() === msg.user.login
        ? msg.user.name
        : msg.user.login;

    const command = commands.getCommand(client, msg.commandName);
    if (command) {
      let { access, botRequires } = command;

      if (botRequires && msg.channel.login !== bot_settings.bot_login) {
        const channelState =
          client?.userStateTracker!.channelStates[msg.channel.login];

        if (botRequires === "vip") {
          if (!channelState?.badges.hasVIP && !channelState?.isMod) {
            return msg.send(
              `${msg.user.name}, the bot requires VIP or MOD to execute this command`,
              true
            );
          }
        } else if (botRequires === "mod") {
          if (!channelState?.isMod) {
            return msg.send(
              `${msg.user.name}, the bot requires MOD to execute this command`,
              true
            );
          }
        }
      }

      if (access && msg.user.login !== bot_settings.owner_login) {
        const { mod, vip, broadcaster } = msg.user.perms;

        if (access === "vip") {
          if (!vip && !mod && !broadcaster) {
            return msg.send(
              `${msg.user.name}, you need to be a vip to use this command`,
              true
            );
          }
        } else if (access === "mod") {
          if (!mod && !broadcaster) {
            return msg.send(
              `${msg.user.name}, you need to be a mod to use this command`,
              true
            );
          }
        } else if (access === "broadcaster") {
          if (!broadcaster) {
            return msg.send(
              `${msg.user.name}, you need to be the channel broadcaster to use this command`,
              true
            );
          }
        } else if (access === "bot-owner") {
          if (msg.user.login !== bot_settings.owner_login) {
            return msg.send(
              `${msg.user.name}, you need to be the bot's owner to use this command`,
              true
            );
          }
        }
      }

      try {
        // if (command.cooldown && msg.user.login !== bot_settings.owner_login) {
        // }

        const result = await command.execute(client, msg, utils);
        if (result) {
          if (result.error) {
            setTimeout(() => {}, 2000);
          }

          if (result.reply) result.text = `${msg.user.name}, ${result.text}`;
          await msg.send(result.text.replace(/\n|\r/g, " "));
        }

        Logger.info(
          `${msg.user.login} executed ${command.name} in ${msg.channel.login}`
        );
      } catch (err) {
        Logger.error(
          `Command execution error: ${command.name} by ${msg.user.login} in ${msg.channel.login}`,
          msg.text,
          err
        );

        await msg.send(
          `❌ Error - (${command.name}) failed to execute properly. Crash data was saved and will be fixed ASAP.`,
          true
        );
      }
    }
  }
}
