import mongoose from "mongoose";

const facebookUserSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  config: {
    required: true,
    type: {
      language: {
        type: String,
        required: true,
        default: "english",
      },
      following: {
        type: [String],
        required: true,
        default: ["dl", "md", "rd"],
      },
    },
  },
});
facebookUserSchema.set("validateBeforeSave", true);
const facebookUserModel = mongoose.model("facebookUser", facebookUserSchema);

export default facebookUserModel;
