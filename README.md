[![image](https://img.shields.io/badge/language-typescript-blue)](https://www.typescriptlang.org)
[![image](https://img.shields.io/badge/node-%3E%3D%2016.0.0-blue)](https://nodejs.org/)

# Twitch-Mod-Bot (Working Title)

Work In Progress
A personal Moderation Bot.

## System Dependencies

- [Node.js LTS](https://nodejs.org/en/download/)

## Installing Bot

- Install Node.js LTS
- Install Mod-Bot dependencies either by running the `Mod-Bot Install.bat` file <b>OR</b> by opening Command Prompt and running `npm install` in the `./Mod-Bot/` folder

## Starting Bot

- Either by running the `Mod-Bot Start.bat` file <b>OR</b> by opening Command Prompt and running `npm run dev` in the `./Mod-Bot/` folder
- Open the Dashboard by going to "http://localhost:8000/" in a private browser.

## Features

- Ban inappropriate usernames from chat with keyword
- Keywords accounts for L33t3d names (Example a Keyword of "bacon" will also trigger on leeted names like "b4c0n_F!x4xt!0n")
- Remove Follow Bot Ads from chat automatically (Timeout for 60sec in case false triggers)
- Track Stream events like subs, raiders, gifters, bits, etc... per stream (long term Stream Metrics not available yet)
- Mod-Bot can be controlled by other Mods with Text Commands or locally with a web browser (Dashboard)
