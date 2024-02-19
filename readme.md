# Yu-Gi-Oh! Online Tour API 1.0

## _Disclaimer: Even tho the app is fully functional, this readme serves as an example and does not constitute a comprehensive documentation. A full setup guide and documentation are planned for release in the future._

## Introduction

Yu-Gi-Oh! Online Tour API provides real-time online tournament data for "Duel Links," "Master Duel," and "Rush Duel." Ideal for developers and enthusiasts, offering efficient access to player standings and match outcomes. You can find a live demo [here](https://cvlfhq42xly43elddwo263eley0rslco.lambda-url.us-east-1.on.aws/).

## Features

- Consistent API format for popular sites hosting Yu-Gi-Oh! online tournaments, such as [Start.gg](https://start.gg), [Tonamel](https://tonamel.com/), and [~~Paidiagaming~~](https://paidiagaming.com/) (Paidiagaming is currently Down)
- The ability to scan and save tournaments hosted by certain Discord servers
- Integration with Messenger and Discord (soon™) bots to send notifications/schedules on upcoming tournaments

## Requirements

- [Start.gg API developer key](https://developer.start.gg/)
- [MongoDB](https://www.mongodb.com/) Database Setup (for storing functionality only)
- [Messenger Bot token](https://developers.facebook.com/) (For Messenger bot functionality only)
- Discord and Tonamel Session Tokens (If you don't know how to get them, you can contact me)
- [Docker](https://www.docker.com/) (required for development only)

## Npm Dependencies

### Production

- Axios
- Express
- Zod
- Mongoose
- Serverless-Express (required for serverless deployment only)
- sparticuz/chromium **_(deprecated)_** (required for serverless deployment only/can be a dev dependency if a layer is set up)

### Dev

- Typescript
- puppeteer-core **_(deprecated)_** (required for serverless deployment only/can be a dev dependency if a layer is set up)
- vitest

## Required Environment Variables

- STARTGG_TOKEN, token you get from Start.gg's developer's portal
- DISCORD_TOKEN, contact me if you cannot get it
- DB_ENDPOINT, endpoint connection to your MongoDB database
- DB_ENDPOINT_DEV, endpoint connection to your MongoDB database (dev mode)
- MESSENGER_VERIFY_TOKEN, you get it from Messenger dev bot page
- FACEBOOK_PAGE_ACCESS_TOKEN, you get it from Messenger dev bot page
- FACEBOOK_PAGE_ID, you get it from Messenger dev bot page
- TONAMEL_TOKEN, contact me if you cannot get it
- TONAMEL_COOKIE, contact me if you cannot get it

## Development Environment

After setting up Docker/docker-compose, save the development environments to a .env file, then run the following command:
`docker compose up tournament-scrapper-dev`

## Tests

To run tests, run the following command (at this time, coverage is only 14%):
`npm run test`

## Examples

### For now, the api documentation is not avalable yet, but these are some of the example request/response from the api.

### If you want to test/use the endpoint without deploying the code yourself, you can use [this demo already deployed to aws lambda](https://cvlfhq42xly43elddwo263eley0rslco.lambda-url.us-east-1.on.aws/).<br><br>For these examples, we are gonna use [Duel Links Grand Prix #1](https://www.start.gg/tournament/duel-links-grand-prix-1-1/) as start.gg example, [G1X #150](https://tonamel.com/competition/boZzF) as tonamel example, ~~and [Latam Showdown Rush Duel #1](https://paidiagaming.com/tournament/latam-showdown-rush-duel-1-6515a9756ed9b6ad202c45f7) as paidiagaming example~~.

> ## Start.gg request:
>
> GET `your-end-point/startgg/info/duel-links-grand-prix-1-1`
>
> ### response:
>
> ```json
> {
>   "title": "Duel Links Grand Prix #1",
>   "date": 1670439600000,
>   "details": "\n\n**Date**: December 7th @ 2 pm EST\n\n**Entry Fee**: Free.\n\n**Prize**: $30 ($20 for 1st and $10 for 2nd)\n\n**Format**: 1 Deck, 8 Card Side, Best of 3, 3-5 Rounds, Top 16 or 32 based on attendance.\n\n**Requirements**: Follow me on Twitch and join the Grand Central Station Discord.\n\n**Streamed at:** http://www.twitch.tv/GrandHarrier\n\n**Join the Discord:** https://discord.gg/56yejg3nsd\n- Rounds are 50 minutes long.\n- You have 8 minutes to check in.\n- You must not delay in making a Duel Room; whomever shows up first should be the one to make it.\n- If you need a minute or two after a game to get a drink or use the restroom, communicate with your opponent. Do not delay.\n- Call a moderator if your opponent overly delays for any reason.\n- At the end of 50 minutes the game will conclude at the end of the current turn and the player with the most life points wins.\n- If a game begins in time then highest life at the end of turn 4 will be declared the winner.\n- Your Duel Room must have 5 spots, allowing for both the streamer and moderators to join as needed. \n- You must create a new Duel Room for each match\n- If there is a Spectator that is not the streamer, call a Moderator for assistance.\n- All cards are legal as soon as they are released.\n- If a banlist is announced it will be implemented immediately and all Duel Rooms must be Unlimited if needed.\n- Always take a screenshot of your issue, whether it is a disconnection or glitch, and call a moderator for assistance. They will judge the situation on a case by case basis, however.\n- There is no tolerance for unsportsmanlike conduct directed at your opponent, mods, or streamer.\n- If you are caught using a card that is not on your decklist you will be actioned accordingly depending on the severity of the situation.\n- 3-5 ROUNDS(no elimination) -> Top 16-32 Cut\n\n- Best of 3 ENTIRE tournament.",
>   "game": "Yu-Gi-Oh! Duel Links",
>   "participants": 161,
>   "state": 2,
>   "organizer": 404318,
>   "url": "start.gg/tournament/duel-links-grand-prix-1-1",
>   "tags": ["sd"]
> }
> ```

> ## Tonamel example:
>
> GET `your-end-point/tonamel/info/boZzF`
>
> ### response:
>
> ```json
> {
>   "title": "G1X 150th",
>   "date": 1679400000,
>   "details": "ーーー形式ーーー\n1回負けたら敗退/2本先取/2デッキ制\n\nーーーデッキ提出ーーー\n・21時までにエントリーページから提出\n\nーーー配信ーーー\n・自由（助言を貰う、誹謗中傷は禁止）\n\nーーー大会進行ーーー\n・1本目→必ず「DECK１」を使用\n・2本目以降→提出したデッキどちらも使用OK\n・対戦相手が決まり次第、試合開始\n・対戦ルーム→時間「180秒」 / 観戦「ON」 / 人数「5人」\n・初戦は試合開始時刻より「10分遅刻」で不戦敗。2回戦以降は後から勝ち上がった人の「初回アクセスより10分間」試合開始できない場合は不戦敗ライン。※状況で判断\n・成績を「0-0」で記入した上で勝利報告（5分後自動承認）\n・試合制限時間は「40分間」。3回超えた場合失格。\n\nーーー賞金ーーー\n🥇1st Place / ￥1,500分ギフトコード\n",
>   "game": "Yu-Gi-Oh! Duel Links",
>   "participants": 67,
>   "state": 2,
>   "limit": 128,
>   "organizer": "6QvaH",
>   "url": "tonamel.com/competition/boZzF",
>   "tags": ["sd"]
> }
> ```

> ## ~~Paidiagaming example:~~
>
> ~~GET `your-end-point/paidiagaming/info/latam-showdown-rush-duel-3-6523693ca695760b7a4abc1f`~~
>
> ### ~~response:~~
>
> ~~`{"Latam Showdown Rush Duel #3\n\nDate: October, Monday 09th at 20:00pm EST\nEntry Fee: Free!\nPrize: $10 USD\nFormat: 1 Deck, Bo3\n\nREQUIREMENT\n• You MUST be a part of the LatamYGO Discord https://discord.gg/5APzcU9fYE\n• You MUST have a PAIDIA GAMING account with the same name as discord. Please make sure your PAIDIA GAMING\n• Username matches your discord account before sign up. You can change it in Account Setting.\n\nDECK SUBMISSION\nOnly for tournament participants, you must enter this Discord https://discord.gg/rh4P7cAn7h and ask a moderator for your private channel, there you will upload your decks every time you participate in LatamYGO tournaments. You will do it only 1 time. Every time you participate in our tournaments, use your private channel to upload your decks. \n\nIf you have any questions or would like to request a moderator, please ask at ⁠#help-events in LatamYGO Discord. Both players must update scores If your opponent fails, please provide the table number and score at ⁠#score-update-paidia in LatamYGO Discord. To get tournament update pings, get the \"Tournament Participant\" role on our discord or ask a moderator for it.\n\nStreamed by SuperViz at: https://www.twitch.tv/latamygo\nCome show your support to continue holding more tournaments and with a bigger prize pool!\n\nPresentación en español\n• Si vas a jugar los torneos, debes estar mandatoriamente en nuestro discord para reportar resultados y enterarte de todos los torneos que haremos: https://discord.gg/5APzcU9fYE\n• Para participar, previamente debes tener una cuenta creada en PAIDIA GAMING con el mismo nombre que tu discord. Asegúrate de esto ya que los moderadores te ubicarán más rápido, los que tengan nicks distintos, no lo tomaremos en cuenta. Puedes cambiar tu nick en CONFIGURACIÓN DE LA CUENTA.\n\nREGISTRO DE DECKS\nHemos creado un discord para que los participantes se unan y POR ÚNICA VEZ, soliciten su canal privado para registrar los decks. Cada vez que participes en uno de nuestros torneos, solo vuelve a tu canal y sube tus nuevos decks. Puedes solicitar la creación de tu canal privado a un moder","game":"Yu-Gi-Oh! Duel Links","participants":67,"state":2,"organizer":"LatamYGO","url":"paidiagaming.com/tournament/latam-showdown-rush-duel-3-6523693ca695760b7a4abc1f","tags":["rd"]}`~~

## Contact me

- ### Discord: playmakerey
- ### Email: playmakerey@gmail.com
