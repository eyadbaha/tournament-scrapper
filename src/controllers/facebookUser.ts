import facebookUserModel from "../models/facebookUser.js";
import { Document } from "mongoose";

interface FacebookUserSchema extends Document {
  id: string;
  config: {
    language: string;
    following: string[];
  };
}
const createFacebookUser = async (facebookUser: {
  id: string;
  config: {
    language: string;
    following: string[];
  };
}) => {
  try {
    const newFacebookUser = await facebookUserModel.create(facebookUser);
    console.log(newFacebookUser);
  } catch (error) {
    console.log(error);
  }
};
const getFacebookUser = async (id: string): Promise<FacebookUser | null> => {
  try {
    const facebookUser = await facebookUserModel.findOne({ id }).lean();
    return facebookUser;
  } catch {
    return null;
  }
};
const getAllFacebookUsers = async (): Promise<FacebookUserSchema[] | null> => {
  try {
    const facebookUser = await facebookUserModel.find({});
    return facebookUser;
  } catch {
    return null;
  }
};
const updateFacebookUser = async (facebookUser: {
  id: String;
  config: {
    language: string;
    following: string[];
  };
}): Promise<FacebookUserSchema | null> => {
  try {
    const foundFacebookUser = await facebookUserModel.findOne({ id: facebookUser.id });

    if (foundFacebookUser) {
      foundFacebookUser.config = facebookUser.config;
      await foundFacebookUser.save();
      return foundFacebookUser;
    }

    return null;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};
const removeFacebookUser = async (id: string): Promise<FacebookUserSchema | null> => {
  try {
    const facebookUser = await facebookUserModel.findOneAndRemove({ id });
    return facebookUser;
  } catch {
    return null;
  }
};
const facebookUserController = {
  createFacebookUser,
  getFacebookUser,
  getAllFacebookUsers,
  updateFacebookUser,
  removeFacebookUser,
};
export default facebookUserController;
