import { Color, IRCMessageTags, TwitchBadgesList, TwitchEmoteList } from '@kararty/dank-twitch-irc';

import type { TwitchAPI } from "./twitchAPI";

export interface TwitchToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string[];
  token_type: string;
}

export interface ClientTwitchExtension {
  api: TwitchAPI;
  auth: {
    api: TwitchToken;
    tmi: TwitchToken;
  };
  banned_users: DBTwitchUser[];
  permitted_users: DBTwitchUser[];
  modded_users: string[];
  vip_users: string[];
  okUsers: string[];
  bot: TwitchUser;
  wordBank: {
    blocked: string[];
  };
  stream_data: StreamData;
  stream?: TwitchStream;
}

export interface ClientCommandData {
  name: string;
  category: string;
  aliases?: string[];
  description: string;
  access: string;
  accessBadge?: string;
  cooldown?: number;
  usage?: string;
  example?: string;
}

export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email: string;
  created_at: string;
}

export interface DBTwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email: string;
  created_at: string;
  banned_date?: string;
  permitted_date?: string;
}

export interface TwitchUsersResponse {
  data: TwitchUser[];
}

export interface TwitchFollow {
  from_id: string;
  from_login: string;
  from_name: string;
  to_id: string;
  to_login: string;
  to_name: string;
  followed_at: string;
}

export interface TwitchFollowsResponse {
  data: TwitchFollow[];
  pagination: {
    cursor?: string;
  };
  total: number;
}

export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

export interface TwitchStreamsResponse {
  data: TwitchStream[];
  pagination: {
    cursor?: string;
  };
}

export interface TwitchGame {
  box_art_url: string;
  id: string;
  name: string;
}

export interface TwitchGamesResponse {
  data: TwitchGame[];
  pagination: {
    cursor?: string;
  };
}

export interface MessageData {
  user: {
    id: string;
    name: string;
    login: string;
    colorRaw: string;
    badges: TwitchBadgesList;
    badgesRaw: string;
    color?: Color;
    perms: {
      mod: boolean;
      broadcaster: boolean;
      vip: boolean;
      owner: boolean;
    };
  };
  channel: {
    id: string;
    login: string;
  };
  messageID: string;
  isAction: boolean;
  raw: string;
  text: string;
  timestamp: string;
  emotes: TwitchEmoteList;
  tags: IRCMessageTags;
  bits?: number;
  args?: string[];
  prefix: string;
  commandName?: string;
  send: (message: string, reply?: boolean) => Promise<void>;
}

export interface TwitchValidateToken {
  client_id: string;
  login: string;
  scopes: string[];
  user_id: string;
  expires_in?: number;
}

export interface TwitchInvalidateToken {
  message: string;
  status: number;
}

export interface BotConfig {
  owner_login: string;
  bot_login: string;
  channel_to_moderate: string;
  client_id: string;
  client_secret: string;
}

export interface DBToken {
  access_token: string;
  expires?: number;
  scopes?: string[];
}

export interface TwitchChatters {
  _links: {};
  chatter_count: number;
  chatters: TwitchViewers;
}

export interface TwitchChattersResponse {
  data: TwitchChatters;
}

export interface TwitchViewers {
  broadcaster: string[];
  vips: string[];
  moderators: string[];
  staff: string[];
  admins: string[];
  global_mods: string[];
  viewers: string[];
}

export interface StreamData {
  raiders: string[];
  subs: string[];
  reSubs: string[];
  gifters: any;
  welcomeList: string[];
  cheerers: string[];
  binxRaids: string[];
}

export interface TwitchBannedUserList {
  user_id: string;
  user_login: string;
  user_name: string;
  expires_at: string;
  created_at: string;
  reason: string;
  moderator_id: string;
  moderator_login: string;
  moderator_name: string;
}

export interface TwitchBannedUserListResponse {
  data: TwitchBannedUserList[];
  pagination: {
    cursor?: string;
  };
  total: number;
}
