import {
  getAllBanned,
  getAllPermitted,
  getSavedStreamData,
  getUserData,
  getWordBank,
} from "./lib/utils/database";
import { TwitchAPI } from "./lib/utils/twitchAPI";
import {
  ClientTwitchExtension,
  StreamData,
  TwitchToken,
  TwitchUser,
} from "./lib/utils/twitchAPI-types";
import {
  ChatClient,
  AlternateMessageModifier,
  UserStateTracker,
  SlowModeRateLimiter,
} from "@kararty/dank-twitch-irc";
import { bot_settings } from "./server";
import Logger from "./lib/utils/logger";
import { loadCommands } from "./lib/misc/commands";
import("./lib/misc/commands");

export class TwitchBot extends ChatClient {
  commands: Map<string, any> = {} as Map<string, any>;
  aliases: Map<string, string> = {} as Map<string, string>;
  categories: Map<string, string> = {} as Map<string, string>;
  knownCommands: any = null;
  commandsData: any[] = [];
  twitch: ClientTwitchExtension = {
    api: new TwitchAPI(bot_settings.client_id, bot_settings.client_secret),
    auth: {
      api: {
        // access_token: "",
        // refresh_token: "",
        // expires_in: 0,
        // token_type: "",
        // scope: [""],
      } as TwitchToken,
      tmi: {
        // access_token: "",
        // refresh_token: "",
        // expires_in: 0,
        // token_type: "",
        // scope: [""],
      } as TwitchToken,
    },
    permitted_users: [],
    banned_users: [],
    modded_users: [],
    vip_users: [],
    okUsers: [],
    bot: {
      // id: "",
      // login: "",
      // display_name: "",
      // type: "",
      // broadcaster_type: "",
      // description: "",
      // profile_image_url: "",
      // offline_image_url: "",
      // view_count: 0,
      // email: "",
      // created_at: "",
    } as TwitchUser,
    wordBank: {
      blocked: [],
    },
    stream_data: {
      // subs: [],
      // reSubs: [],
      // raiders: [],
      // binxRaids: [],
      // gifters: {},
      // welcomeList: [],
      // cheerers: [],
    } as StreamData,
    stream: undefined,
  };
  noticeMessage: string = "";
  categorizedCommands: any = { basic: [], channel: [], utility: [] };

  public constructor(token: string) {
    super({
      username: bot_settings.bot_login,
      password: "oauth:" + token,
      rateLimits: "default",
      ignoreUnhandledPromiseRejections: true,
      installDefaultMixins: true,
    });
    this.use(new UserStateTracker(this));
    this.use(new AlternateMessageModifier(this));
    this.use(new SlowModeRateLimiter(this, 2));

    this.commands = new Map();
    this.categories = new Map();
    this.aliases = new Map();
    loadCommands(this);
    this.knownCommands = Object.values(this.categorizedCommands).reduce(
      (a: any, b: any) => a.concat(b)
    );
    this.noticeMessage = "";
    getAllBanned(this);
    getAllPermitted(this);
    getUserData().then((db) => {
      db.map((data) => {
        this.twitch.bot = data.value as TwitchUser;
      });
    });
    getWordBank(this);
    getSavedStreamData().then((data) => {
      this.twitch.stream_data = data;
    });
    const scope = "user:read:email";

    this.twitch.api
      ?.getAccessToken(scope)
      .then((response) => {
        this.twitch.auth.api = response as TwitchToken;
      })
      .catch((err) => {
        Logger.error(err);
        Logger.error(
          "This means Twitch Api Calls Don't Work, Please make sure you copied both the Clients ID and Client Secret correctly"
        );
      });

    let refreshTimer = setInterval(() => {
      this.twitch.api
        ?.getAccessToken(scope)
        .then((response) => {
          this.twitch.auth.api = response as TwitchToken;
        })
        .catch((err) => {
          Logger.error(err);
          Logger.error(
            "This means Twitch Api Calls Don't Work, Please make sure you copied both the Clients ID and Client Secret correctly and restart the bot."
          );
          clearInterval(refreshTimer);
        });
    }, 4.32e7);
    refreshTimer;
  }
}
