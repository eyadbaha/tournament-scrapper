import tournamentModel from "../models/tournament.js";
import mongoose, { Document, ObjectId } from "mongoose";

interface TournamentSchema extends Document {
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
type Tournament = {
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
};
const createTournament = async (channel: any): Promise<Boolean> => {
  try {
    const newTournament = await tournamentModel.create(channel);
    console.log(newTournament);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
const getTournament = async (_id: ObjectId): Promise<Tournament | null> => {
  try {
    const channel = (await tournamentModel.findById(_id).lean()) as Tournament;
    return channel || null;
  } catch {
    return null;
  }
};
const getAllTournaments = async (): Promise<Tournament[] | null> => {
  try {
    const channel = (await tournamentModel.find({}).lean()) as Tournament[];
    return channel;
  } catch {
    return null;
  }
};
const tournamentController = { createTournament, getTournament, getAllTournaments };
export default tournamentController;
