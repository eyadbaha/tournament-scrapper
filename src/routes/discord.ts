import express from "express";
import { getDiscordMessages } from "../utils/getDiscordMessages.js";
import channelController from "../controllers/channel.js";
import startgg from "../utils/startgg.js";
import tournamentController from "../controllers/tournament.js";
import facebookUserController from "../controllers/facebookUser.js";
import { callSendAPI } from "./webhook.js";

const discordRouter = express.Router();
discordRouter.get("/", (req, res) => {
  res.send("v1.0");
});
discordRouter.post("/", async (req, res) => {
  const channelID = req.body.id;
  const data = await getDiscordMessages(channelID);
  const channel = await channelController.getChannel(channelID);
  if (!channel) {
    await channelController.createChannel({
      id: channelID,
      lastMessageId: data[0].id,
    });
    return res.json({ success: true, message: `Added discord channel (${channelID}) to watch list.` });
  }
  return res.status(409).json({ success: false, message: "Channel with this ID already exists." });
});
discordRouter.post("/update", async (req, res) => {
  const allChannels = await channelController.getAllChannels();
  if (allChannels) {
    for (let channel of allChannels) {
      const data = (await getDiscordMessages(channel.id))[0];
      if (data.id != channel.lastMessageId) {
        let messages = (await getDiscordMessages(channel.id, 50)).reverse();
        const startIndex = messages.findIndex((message: any) => message.id == channel.lastMessageId);
        if (startIndex != -1) messages = messages.slice(startIndex + 1);
        let infoArray = [];
        for (let message of messages) {
          const messageUrls = message.content.match(/((https?:\/\/)|(www\.))[^\s/$.?#].[^\s]*/gi);
          for (let url of messageUrls) {
            if (["smash.gg", "start.gg"].some((link) => url.includes(link))) {
              const id = /^(?:https?:\/\/)?(?:www\.)?[^/]+\/[^/]+\/([^/]+)/.exec(url)?.[1];
              try {
                const info = await startgg.getInfo(id || "");
                infoArray.push({ ...info, id });
              } catch (err) {
                console.log(url, id);
              }
            }
          }
        }
        for (let info of infoArray) {
          const tags = [];
          if (info.game.toLocaleLowerCase().includes("links")) {
            if (info.title.toLocaleLowerCase().includes("rush")) {
              tags.push("rd");
            } else tags.push("sd");
          } else if (info.game.toLocaleLowerCase().includes("master")) {
            tags.push("md");
          }
          const postSuccess = await tournamentController.createTournament({
            site: "startgg",
            id: info.id,
            date: info.date,
            tags: tags,
            game: info.game,
            participants: info.participants,
            state: info.state,
            limit: info.limit,
            organizer: info.organizer,
            title: info.title,
            details: info.details,
          });
          if (postSuccess) {
            const messageArray = [];
            messageArray.push(`Title:${info.title}`);
            if (tags.includes("rd")) {
              messageArray.push("Format: Rush Duel");
            } else if (tags.includes("sd")) {
              messageArray.push("Format: Speed Duel");
            } else if (tags.includes("md")) {
              messageArray.push("Format: Master Duel");
            }
            messageArray.push(`Date: ${new Date(info.date)}`);
            messageArray.push(`Link: https://www.start.gg/tournament/${info.id}`);
            const message = messageArray.reduce((sum, message) => {
              return sum + `-${message}\n`;
            }, "");
            const facebookUsers = (await facebookUserController.getAllFacebookUsers()) || [];
            for (let facebookUser of facebookUsers) {
              if (tags.some((item) => facebookUser.config.following.includes(item)))
                await callSendAPI(facebookUser.id, { text: message });
            }
          }
        }
        await channelController.updateChannel({ id: channel.id, lastMessageId: data.id });
      }
    }
  }
  return res.json({ success: true });
});
discordRouter.get("/:id", async (req, res) => {
  const channelID = req.params.id;
  const data = await getDiscordMessages(channelID);
  const message = data[0].content;
  const channel = await channelController.getChannel(channelID);
  if (!channel) {
    await channelController.createChannel({
      id: channelID,
      lastMessageId: data[0].id,
    });
  }
  console.log(channel);
  const messageUrls = message.match(/((https?:\/\/)|(www\.))[^\s/$.?#].[^\s]*/gi);
  res.json(messageUrls);
});

export { discordRouter };
