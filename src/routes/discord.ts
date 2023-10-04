import express from "express";
import discord from "../services/discord.js";
import channelController from "../controllers/channel.js";
import tournamentController from "../controllers/tournament.js";
import facebookUserController from "../controllers/facebookUser.js";
import formatDate from "../utils/formatDate.js";
import messenger from "../services/messenger.js";
import tournamentScrape from "../services/tournamentScrape.js";
import { DataSchema } from "../schemas/infoData.js";

const discordRouter = express.Router();

discordRouter.post("/", async (req, res, next) => {
  const channelID = req.body.id;
  try {
    if (!channelID) return res.status(40).send({ success: false, message: "No channel ID Provided." });
    const data = await discord.getDiscordMessages(channelID);
    const channel = await channelController.getChannel(channelID);
    if (!channel) {
      await channelController.createChannel({
        id: channelID,
        lastMessageId: data[0].id,
      });
      return res.json({ success: true, message: `Added discord channel (${channelID}) to watch list.` });
    }
    return res.status(409).json({ success: false, message: "Channel with this ID already exists." });
  } catch (error) {
    console.log(error);
    next();
  }
});
discordRouter.post("/update", async (req, res) => {
  const allChannels = await channelController.getAllChannels();
  if (allChannels) {
    for (let channel of allChannels) {
      const data = (await discord.getDiscordMessages(channel.id))[0];
      if (data.id != channel.lastMessageId) {
        let messages = (await discord.getDiscordMessages(channel.id, 50)).reverse();
        const startIndex = messages.findIndex(
          (message: { id: string; content: string }) => message.id == channel.lastMessageId
        );
        if (startIndex != -1) messages = messages.slice(startIndex + 1);
        let infoArray: DataSchema[] = [];
        for (let message of messages) {
          const messageUrls = message.content.match(/((https?:\/\/)|(www\.))[^\s/$.?#].[^\s]*/gi) || [];
          for (let url of messageUrls) {
            try {
              const info = await tournamentScrape.getInfo(url);
              if (info) infoArray.push(info);
            } catch (err) {
              console.log(url);
            }
          }
        }
        for (let info of infoArray) {
          const postSuccess = await tournamentController.createTournament(info);
          if (postSuccess) {
            const messageArray = [];
            messageArray.push(`Title:${info.title}`);
            if (info.tags.includes("rd")) {
              messageArray.push("Format: Rush Duel");
            } else if (info.tags.includes("sd")) {
              messageArray.push("Format: Speed Duel");
            } else if (info.tags.includes("md")) {
              messageArray.push("Format: Master Duel");
            }
            messageArray.push(`Date: ${formatDate(info.date)}`);
            messageArray.push(`Link: https://www.${info.url}`);
            const message = messageArray.reduce((sum, message) => {
              return sum + `-${message}\n`;
            }, "");
            const facebookUsers = (await facebookUserController.getAllFacebookUsers()) || [];
            for (let facebookUser of facebookUsers) {
              if (info.tags.some((item) => facebookUser.config.following.includes(item)))
                await messenger.callSendAPI(
                  facebookUser.id,
                  { text: message },
                  { messaging_type: "MESSAGE_TAG", tag: "CONFIRMED_EVENT_UPDATE" }
                );
            }
          }
        }
        await channelController.updateChannel({ id: channel.id, lastMessageId: data.id });
      }
    }
  }
  return res.json({ success: true });
});

export { discordRouter };
