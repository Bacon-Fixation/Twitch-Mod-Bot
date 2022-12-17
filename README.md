[![image](https://img.shields.io/badge/language-typescript-blue)](https://www.typescriptlang.org)
[![image](https://img.shields.io/badge/node-%3E%3D%2016.0.0-blue)](https://nodejs.org/)

# Twitch-Mod-Bot (Working Title)

<b>Work In Progress</b>
A personal Auto Mod Bot for Twitch to help combat inappropriate username harassment, and Follow Bot advertisements from the chat.
it is designed to moderate only one channel locally as part of your stream kit

## System Dependencies

- [Node.js LTS](https://nodejs.org/en/download/)

## Installing Bot

- Install Node.js LTS
- Install Mod-Bot dependencies either by running the `Mod-Bot Install.bat` file </br><b>OR</b></br> by opening Command Prompt and running `npm install` in the `./Twitch-Mod-Bot/` folder

## Starting Bot

- Either by running the `Mod-Bot Start.bat` file </br><b>OR</b></br> by opening Command Prompt and running `npm run dev` in the `./Twitch-Mod-Bot/` folder
- Open the <b>Dashboard</b> by going to "http://localhost:8000/" in a private browser tab. (Incognito Mode)
- If needed follow the steps in the Dashboard to create/setup Mod-Bot  

## Features
Currently list of available features

- Dashboard Controls
- Ban inappropriate usernames from chat with keyword
- Keywords accounts for L33t3d names (Example a Keyword of "bacon" will also trigger on leeted names like "b4c0n_F!x4xt!0n")
- Remove Follow Bot Ads from chat automatically
- Track Stream events like subs, raiders, gifters, bits, etc... per stream (long term Stream Metrics not available yet)
- Mod-Bot can be controlled by other Mods with Text Commands `^commands` or locally with a web browser (Dashboard)
- Expandable Command Framework ([Command Template](https://github.com/Bacon-Fixation/Twitch-Mod-Bot/wiki/Creating-Custom-Command#custom-command-template))
- Both Twitch TMI IRC (Twitch Chat) and Twitch API Support
- Error Logging: all errors are save to a log file in `./Twitch-Mod-Bot/logs/` (only keeps the last 14 logs)

## To Do
being a work in progress, here is whats planned 
- Make the Account Age and Follow Age Limits adjustable
- Make Keywords for the Follow Bot triggers custumizable
- Switch to using the Prisma instead of quick.db (Database Optimizations)
- Add Command Cooldowns (prevent command spamming)
- Stream to Stream Metrics (help track growth)
- Auto Welcome and/or Shout-out specific users with persnalized messages
- Notify the Chat when a Streamer you would like to support goes live while you are streaming (advertise a fellow streamer)
