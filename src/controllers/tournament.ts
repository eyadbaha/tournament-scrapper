import tournamentModel from "../models/tournament.js";
import mongoose, { Document, ObjectId } from "mongoose";

interface ChannelSchema extends Document {
  site: String;
  id: String;
  date: Date;
  tags: String[];
  game: String;
  participants?: Number;
  state: Number;
  limit?: Number;
  organizer?: Number;
  title: String;
  details?: String;
}

const createTournament = async (channel: any) => {
  try {
    const newTournament = await tournamentModel.create(channel);
    console.log(newTournament);
  } catch (error) {
    console.log(error);
  }
};
const getTournament = async (_id: ObjectId): Promise<ChannelSchema | null> => {
  try {
    const channel = (await tournamentModel.findById(_id)) as any;
    return channel || null;
  } catch {
    return null;
  }
};
const getAllTournaments = async (): Promise<ChannelSchema[] | null> => {
  try {
    const channel = (await tournamentModel.find({})) as any;
    return channel;
  } catch {
    return null;
  }
};
const tournamentController = { createTournament, getTournament, getAllTournaments };
export default tournamentController;
