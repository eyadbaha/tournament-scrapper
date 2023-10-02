import express from "express";
import { getDiscordMessages } from "../utils/getDiscordMessages.js";
import channelController from "../controllers/channel.js";
import startgg from "../utils/startgg.js";

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
        let infoArray: any[] = [];
        for (let message of messages) {
          const messageUrls = message.content.match(/((https?:\/\/)|(www\.))[^\s/$.?#].[^\s]*/gi);
          for (let url of messageUrls) {
            if (["smash.gg", "start.gg"].some((link) => url.includes(link))) {
              const id = /^(?:https?:\/\/)?(?:www\.)?[^/]+\/[^/]+\/([^/]+)/.exec(url)?.[1];
              try {
                const info = await startgg.getInfo(id || "");
                infoArray.push(info);
              } catch (err) {
                console.log(url, id);
              }
            }
          }
        }
        console.log(infoArray);
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
