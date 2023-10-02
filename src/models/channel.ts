import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  lastMessageId: {
    type: String,
    default: "",
  },
});
channelSchema.set("validateBeforeSave", true);
const channelModel = mongoose.model("tournament", channelSchema);

export default channelModel;
