import channelModel from "../models/channel.js";
import { Document } from "mongoose";

interface ChannelSchema extends Document {
  id: string;
  lastMessageId: string;
  name: string;
}

const createChannel = async (channel: { id: string; lastMessageId: string; name: string }) => {
  try {
    const newChannel = await channelModel.create(channel);
    console.log(newChannel);
  } catch (error) {
    console.log(error);
  }
};
const getChannel = async (id: string): Promise<ChannelSchema | null> => {
  try {
    const channel = await channelModel.findOne({ id });
    return channel;
  } catch {
    return null;
  }
};
const getAllChannels = async (): Promise<ChannelSchema[] | null> => {
  try {
    const channel = await channelModel.find({});
    return channel;
  } catch {
    return null;
  }
};
const updateChannel = async (channel: {
  id: string;
  lastMessageId: string;
  name: string;
}): Promise<ChannelSchema | null> => {
  try {
    const foundChannel = await channelModel.findOne({ id: channel.id });

    if (foundChannel) {
      foundChannel.lastMessageId = channel.lastMessageId;
      await foundChannel.save();
      return foundChannel;
    }

    return null;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};
const channelController = { createChannel, getChannel, getAllChannels, updateChannel };
export default channelController;
