import axios, { AxiosInstance, AxiosResponse } from "axios";
import { URLSearchParams } from "url";
import type {
  TwitchToken,
  TwitchUser,
  TwitchUsersResponse,
  TwitchStream,
  TwitchStreamsResponse,
  TwitchGame,
  TwitchGamesResponse,
  TwitchChatters,
  TwitchChattersResponse,
  TwitchFollowsResponse,
  TwitchFollow,
  TwitchValidateToken,
  TwitchBannedUserListResponse,
  TwitchBannedUserList,
} from "./twitchAPI-types";

// Max Number per call is 100 entries
const chunk_size = 100;

export class TwitchAPI {
  _helix?: AxiosInstance;
  _auth?: AxiosInstance;

  private client_id?: string;
  private client_secret?: string;

  constructor(client_id?: string, client_secret?: string) {
    if (!client_id || !client_secret) {
      return;
    }
    this.client_id = client_id;
    this.client_secret = client_secret;

    this._auth = axios.create({
      baseURL: "https://id.twitch.tv/oauth2",
    });

    this._helix = axios.create({
      baseURL: "https://api.twitch.tv/helix",
      headers: {
        "Client-ID": client_id,
      },
    });

    this._auth.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        throw error.response.data;
      }
    );

    this._helix.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        throw error.response.data;
      }
    );
  }
  validateAccessToken = (token: string): Promise<TwitchValidateToken> => {
    return new Promise(async (resolve, reject) => {
      if (!this.client_id || !this.client_secret || !this._auth || !this._helix)
        return;

      try {
        const response: TwitchValidateToken = await this._auth.get(
          `/validate`,
          {
            headers: {
              Authorization: "Bearer " + token,
            },
            responseType: "json",
          }
        );
        resolve(response);
      } catch (err) {
        reject(err);
      }
    });
  };

  refreshAccessToken = (refresh_token: string): Promise<TwitchToken> => {
    return new Promise(async (resolve, reject) => {
      if (!this.client_id || !this.client_secret || !this._auth || !this._helix)
        return;

      try {
        const qs = new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token,
          client_id: this.client_id,
          client_secret: this.client_secret,
        });

        const response: TwitchToken = await this._auth.post(`/token?${qs}`);
        resolve(response);
      } catch (err) {
        reject(err);
      }
    });
  };

  getAccessToken = (scopes: string): Promise<TwitchToken> => {
    return new Promise(async (resolve, reject) => {
      if (!this.client_id || !this.client_secret || !this._auth || !this._helix)
        return;
      try {
        const query = new URLSearchParams({
          client_id: this.client_id,
          client_secret: this.client_secret,
          scope: scopes,
          grant_type: "client_credentials",
        });
        const response: TwitchToken = await this._auth.post(`/token?${query}`);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  };
  // getIRCAccessToken = (scopes: string): Promise<TwitchToken> => {
  //   return new Promise(async (resolve, reject) => {
  //     if (!this.client_id || !this.client_secret || !this._auth || !this._helix)
  //       return;

  //     try {
  //       const response = await axios.post(
  //         "https://id.twitch.tv/oauth2/token",
  //         {
  //           client_id: process.env.TWITCH_CLIENT_ID,
  //           client_secret: process.env.TWITCH_CLIENT_SECRET,
  //           // code: getCode.data.code,
  //           grant_type: "authorization_code",
  //           redirect_uri: process.env.REDIRECT_URI,
  //         },
  //         {
  //           headers: {
  //             Accept: "application/json",
  //           },
  //           responseType: "json",
  //         }
  //       );

  //       resolve(response.data);
  //     } catch (error) {
  //       console.log(error);
  //       reject(error);
  //     }
  //   });
  // };
  getFollows = async ({
    twitch_access_token,
    channel_id: to_id,
    user_id: from_id,
  }: {
    twitch_access_token: string;
    channel_id?: string;
    user_id?: string;
  }): Promise<TwitchFollow[]> => {
    return new Promise(async (resolve, reject) => {
      if (!this.client_id || !this.client_secret || !this._auth || !this._helix)
        return;
      try {
        let params = {};
        if (to_id && from_id)
          params = {
            first: String(chunk_size),
            to_id: to_id,
            from_id: from_id as string,
          };
        else if (to_id)
          params = { first: String(chunk_size), to_id: to_id as string };
        else params = { first: String(chunk_size), from_id: from_id as string };

        const result: TwitchFollow[] = [];

        let qs = new URLSearchParams(params);
        let exit = false;

        while (!exit) {
          const response: TwitchFollowsResponse = await this._helix.get(
            `/users/follows?${qs}`,
            {
              headers: {
                Authorization: `Bearer ${twitch_access_token}`,
              },
            }
          );

          result.push(...response.data);
          if (response.total === 0 || !response.pagination.cursor) {
            exit = true;
          } else {
            qs = new URLSearchParams({
              ...params,
              after: response.pagination.cursor,
            });
          }
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  };
  getUsers = async ({
    logins = [],
    token,
  }: {
    logins?: string[];
    token: string;
  }): Promise<TwitchUser[]> => {
    return new Promise(async (resolve, reject) => {
      let result: TwitchUser[] = [];
      if (!this.client_id || !this.client_secret || !this._auth || !this._helix)
        return;
      try {
        const numTotal: number = logins.length ?? 0;

        for (let i = 0; i < numTotal; i += chunk_size) {
          const chunkLogins = logins.slice(i, i + chunk_size);

          if (chunkLogins.length > chunk_size)
            throw new Error("Query Exceeded the chunk size of 100");

          const query = new URLSearchParams();

          chunkLogins.forEach((user_login: string) =>
            query.append("login", user_login)
          );

          const response: TwitchUsersResponse = await this._helix.get(
            `/users?${query}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          result = [...result, ...response.data];
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  };
  getChatters = async ({
    channel,
  }: {
    channel: string;
  }): Promise<TwitchChatters> => {
    return new Promise(async (resolve, reject) => {
      if (!this.client_id || !this.client_secret || !this._auth || !this._helix)
        return;
      try {
        if (!channel) throw new Error(`Empty string in the "channel" property`);

        const response: TwitchChattersResponse = await axios.get(
          `https://tmi.twitch.tv/group/user/${channel}/chatters`
        );
        resolve(response.data);
      } catch (error) {
        reject(error);
      }
    });
  };
  isFollowedAPI = async ({
    access_token,
    userID,
    channelID,
  }: {
    access_token: string;
    userID: string;
    channelID: string;
  }): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      if (!this.client_id || !this.client_secret || !this._auth || !this._helix)
        return;
      if (userID == channelID) {
       return resolve(true);

      }
      try {
        const response: TwitchFollowsResponse = await this._helix.get(
          `users/follows?from_id=${userID}&to_id=${channelID}&first=1`,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        );
        if (response.total == 0) return resolve(false);
        if (response.data[0].to_id == channelID) return resolve(true);
        resolve(false);
      } catch (err) {
        console.log(err);
        resolve(false);
      }
    });
  };

  isFollowed = async ({
    channel,
    user,
  }: {
    channel: string;
    user: string;
  }): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      if (!this.client_id || !this.client_secret || !this._auth || !this._helix)
        return;
      if (channel == user) resolve(true);
      try {
        if (!channel || !user)
          throw new Error(`Empty string in the "channel" of "user" property`);

        const response: AxiosResponse = await axios.get(
          `https://decapi.me/twitch/followed/${channel}/${user}`,
          {
            responseType: "text",
          }
        );
        if (response.data.includes(`${user} does not follow ${channel}`)) {
          return resolve(false);
        }
        if (response.data.includes("A user cannot follow themself.")) {
          return resolve(true);
        } else {
          return resolve(true);
        }
      } catch (error) {
        reject(error);
      }
    });
  };
  followAge = async ({
    channel,
    user,
  }: {
    channel: string;
    user: string;
  }): Promise<number> => {
    return new Promise(async (resolve, reject) => {
      if (!this.client_id || !this.client_secret || !this._auth || !this._helix)
        return;
      try {
        if (!channel || !user)
          throw new Error(`Empty string in the "channel" of "user" property`);

        const response: AxiosResponse = await axios.get(
          `https://decapi.me/twitch/followed/${channel}/${user}`,
          {
            responseType: "text",
          }
        );
        if (response.data.includes(`${user} does not follow ${channel}`)) {
          return resolve(0);
        }
        if (response.data.includes("A user cannot follow themself.")) {
          return resolve(Date.now() - 2 * 60 * 60 * 1000); // past the age limit
        } else {
          const [date, time] = response.data
            .replace("(", "")
            .replace(")", "")
            .replace(".", "")
            .trim()
            .split("-");
          const [month, day, year] = date.trim().split(" ");
          const [parsedTime, amOrPm, utc] = time.trim().split(" ");
          const [hours, mins, sec] = parsedTime.trim().split(":");
          const result = new Date(
            new Date(
              `${day} ${month} ${year} ${hours}:${mins}:${sec} ${utc}`
            ).valueOf() + (amOrPm == "PM" ? 43200000 : 0)
          ).valueOf();
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  getUser = async ({
    login,
    id,
    token,
  }: {
    token: string;
    id?: string;
    login?: string;
  }): Promise<TwitchUser> => {
    return new Promise(async (resolve, reject) => {
      if (!this.client_id || !this.client_secret || !this._auth || !this._helix)
        return;
      try {
        if (!id && !login)
          throw new Error(`Empty string in the "id" or "login" property`);

        const response: TwitchUsersResponse = await this._helix.get(
          `/users?${login ? "login=" + login : "id=" + id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        resolve(response.data[0]);
      } catch (error) {
        reject(error);
      }
    });
  };

  getGame = async ({
    id,
    token,
  }: {
    id: string;
    token: string;
  }): Promise<TwitchGame> => {
    return new Promise(async (resolve, reject) => {
      try {
        const query = new URLSearchParams({ id });
        if (
          !this.client_id ||
          !this.client_secret ||
          !this._auth ||
          !this._helix
        )
          return;

        const response: TwitchGamesResponse = await this._helix.get(
          `/games?${query}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        resolve(response.data[0]);
      } catch (error) {
        reject(error);
      }
    });
  };

  getGames = async ({
    ids,
    token,
  }: {
    ids: string[];
    token: string;
  }): Promise<TwitchGame[]> => {
    return new Promise(async (resolve, reject) => {
      if (!this.client_id || !this.client_secret || !this._auth || !this._helix)
        return;

      let result: TwitchGame[] = [];
      try {
        const numTotal: number = ids.length;

        for (let i = 0; i < numTotal; i += chunk_size) {
          const chunkIds = ids.slice(i, i + chunk_size);
          const query = new URLSearchParams();

          chunkIds.forEach((id: string) => query.append("id", id));

          const response: TwitchGamesResponse = await this._helix.get(
            `/games?${query}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          result = [...result, ...response.data];
        }
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  };

  getStream = async ({
    login,
    token,
  }: {
    login: string;
    token: string;
  }): Promise<TwitchStream> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (
          !this.client_id ||
          !this.client_secret ||
          !this._auth ||
          !this._helix
        )
          return;

        const response: TwitchStreamsResponse = await this._helix.get(
          `/streams?user_login=${login}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        resolve(response.data[0]);
      } catch (error) {
        reject(error);
      }
    });
  };

  getStreamingUsers = async ({
    user_ids = [],
    user_logins = [],
    token,
  }: {
    user_ids?: string[];
    user_logins?: string[];
    token: string;
  }): Promise<TwitchStream[]> => {
    return new Promise(async (resolve, reject) => {
      if (!this.client_id || !this.client_secret || !this._auth || !this._helix)
        return;

      let result: TwitchStream[] = [];
      try {
        if (!user_ids.length && !user_logins.length)
          throw new Error(
            `Empty array in the "user_ids" or "user_logins" property`
          );

        const numTotal: number = user_ids.length ?? 0 + user_logins.length ?? 0;
        let offset: number = 0;

        for (let i = 0; i < numTotal; i += chunk_size) {
          const chunkIds = user_ids.slice(i, i + chunk_size);

          if (i == 0) offset = chunkIds.length;

          const chunkLogins = user_logins.slice(
            i - i == 0 ? 0 : offset,
            i + (chunk_size - chunkIds.length - i == 0 ? 0 : offset)
          );

          if (chunkIds.length + chunkLogins.length > chunk_size)
            throw new Error("Query Exceeded the chunk size of 100");

          const query = new URLSearchParams();

          chunkIds.forEach((user_id: string) =>
            query.append("user_id", user_id)
          );

          chunkLogins.forEach((user_login: string) =>
            query.append("user_login", user_login)
          );

          const response: TwitchStreamsResponse = await this._helix.get(
            `/streams?${query}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          result = [...result, ...response.data];
        }
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  };

  getBannedUsers = async ({
    access_token,
    broadcaster_id: broadcaster_id,
  }: {
    access_token: string;
    broadcaster_id?: string;
  }): Promise<TwitchBannedUserList[]> => {
    return new Promise(async (resolve, reject) => {
      if (!this.client_id || !this.client_secret || !this._auth || !this._helix)
        return;
      try {
        let params = {};
        // if (to_id && from_id)
        //   params = {
        //     first: String(chunk_size),
        //     to_id: to_id,
        //     from_id: from_id as string,
        //   };
        // else if (broadcaster_id)
        params = {
          first: String(chunk_size),
          broadcaster_id: broadcaster_id as string,
        };
        // else params = { first: String(chunk_size), from_id: from_id as string };

        const result: TwitchBannedUserList[] = [];

        let qs = new URLSearchParams(params);
        let exit = false;

        while (!exit) {
          const response: TwitchBannedUserListResponse = await this._helix.get(
            `/moderation/banned?${qs}`,
            {
              headers: {
                Authorization: `Bearer ${access_token}`,
                // "Client-Id": this.client_id
              },
            }
          );

          result.push(...response.data);
          if (response.total === 0 || !response.pagination.cursor) {
            exit = true;
          } else {
            qs = new URLSearchParams({
              ...params,
              after: response.pagination.cursor,
            });
          }
        }
        console.log(result);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  };
}
