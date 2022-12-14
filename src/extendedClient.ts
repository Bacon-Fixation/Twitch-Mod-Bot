import {
  getAllBanned,
  getAllPermitted,
  getSavedStreamData,
  getUserData,
  getWordBank,
  // unBanUser,
} from "./DBHandler";
import { TwitchAPI } from "./twitchAPI";
import {
  ClientTwitchExtension,
  // DBTwitchUser,
  TwitchToken,
} from "./twitchAPI-types";
import {
  ChatClient,
  AlternateMessageModifier,
  UserStateTracker,
  SlowModeRateLimiter,
} from "@kararty/dank-twitch-irc";
import { bot_settings } from "./server";
import Logger from "./logger";
export class TwitchBot extends ChatClient {
  twitch: ClientTwitchExtension = {
    api: new TwitchAPI(bot_settings.client_id, bot_settings.client_secret),
    auth: {
      api: {
        access_token: "",
        refresh_token: "",
        expires_in: 0,
        token_type: "",
        scope: [""],
      },
      tmi: {
        access_token: "",
        refresh_token: "",
        expires_in: 0,
        token_type: "",
        scope: [""],
      },
    },
    permitted_users: [],
    banned_users: [],
    bot: {
      id: "",
      login: "",
      display_name: "",
      type: "",
      broadcaster_type: "",
      description: "",
      profile_image_url: "",
      offline_image_url: "",
      view_count: 0,
      email: "",
      created_at: "",
    },
    wordBank: {
      // allowed: [],
      blocked: [],
    },
    stream_data: {
      subs: [],
      reSubs: [],
      raiders: [],
      binxRaids: [],
      gifters: {},
      welcomeList: [],
      cheerers: [],
    },
    stream: undefined,
  };
  noticeMessage: string = "";
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

    this.noticeMessage = "";
    getAllBanned(this);
    getAllPermitted(this);

    getUserData().then((db) => {
      // console.log(db);
      db.map((data) => {
        this.twitch.bot = data.value;
      });
    });
    getWordBank(this);
    // .then((db) => {
    // db.map((data) => {
    //   // if (data.id == "allowed") this.twitch.wordBank.allowed.push(data.value);
    //   if ((data.id = "blocked")) this.twitch.wordBank.blocked = data.value;
    // });
    //  });
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
