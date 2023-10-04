import axios from "axios";
import express from "express";
import facebookUserController from "../controllers/facebookUser.js";
import tournamentController from "../controllers/tournament.js";
interface MyObject {
  date: number; // Assuming "date" is a timestamp
  string: string;
}

const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.FACEBOOK_PAGE_ID; // Replace with your actual token

async function callSendAPI(senderPSID: string, message: any) {
  const requestURL = `https://graph.facebook.com/v18.0/${PAGE_ID}/messages`;
  const params = {
    recipient: { id: senderPSID },
    message: message,
    messaging_type: "RESPONSE",
    access_token: PAGE_ACCESS_TOKEN,
  };
  console.log(params);
  await axios.post(requestURL, params, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
const toggleUserTag = async (user: any, tag: string) => {
  if (user) {
    const index = user.config.following.indexOf(tag);
    index !== -1 ? user.config.following.splice(index, 1) : user.config.following.push(tag);
    await facebookUserController.updateFacebookUser(user);
    return user;
  }
};
const convertUserTags = (tags: string[] | undefined) => {
  if (!tags || !tags.length) return "-None";
  return (
    tags.map((value) => {
      if (value == "md") return "Master Duel";
      if (value == "sd") return "Speed Duel";
      if (value == "rd") return "Rush Duel";
      return "";
    }) as string[]
  ).reduce((sum, value) => {
    if (!sum) return `-${value}\n`;
    return sum + `-${value}\n`;
  }, "");
};
function groupAndFormatByDay(arr: MyObject[] | undefined): string {
  if (!arr || arr.length === 0) {
    return "No data available."; // Return a default string for empty or undefined arrays
  }

  const groups: { [day: string]: MyObject[] } = {};
  const maxLength = 2000; // Maximum length for the concatenated string
  let currentLength = 0;

  for (const item of arr) {
    const timestamp = item.date;

    // Convert timestamp to a date string representing the day (e.g., "YYYY-MM-DD")
    const date = new Date(timestamp);
    const dayString = date.toISOString().split("T")[0];

    // Calculate the length of the dayString and objectString
    const objectString = item.string; // Updated property name to "string"
    const formattedString = `${dayString}\n-${objectString}`;
    const formattedLength = formattedString.length;

    // Check if adding this day would exceed the limit
    if (currentLength + formattedLength > maxLength) {
      // Stop adding further days if it exceeds the limit
      break;
    }

    // Check if the group for this day exists, or create it if it doesn't
    if (!groups[dayString]) {
      groups[dayString] = [];
    }

    // Add the item to the group
    groups[dayString].push(item);

    // Update the current length
    currentLength += formattedLength;
  }

  // Create a string combining date and objects' strings for each day
  const formattedStrings = Object.entries(groups).map(([day, objects]) => {
    const objectStrings = objects.map((obj) => `-${obj.string}`).join("\n"); // Updated property name to "string"
    return `${day}\n${objectStrings}`;
  });

  return formattedStrings.join("\n\n");
}
async function handleWebhookEvent(webhookEvent: any) {
  const senderPSID = webhookEvent?.sender?.id;
  const payload = webhookEvent?.message?.quick_reply?.payload;
  const user = await facebookUserController.getFacebookUser(senderPSID);
  if (user && !payload) {
    return await callSendAPI(senderPSID, {
      text: "Hello!\nWhat would you like to do?",
      quick_replies: [
        {
          content_type: "text",
          title: "Unsubscribe",
          payload: "UNSUBSCRIBE",
        },
        {
          content_type: "text",
          title: "Settings",
          payload: "SETTINGS_UPDATE",
        },
        {
          content_type: "text",
          title: "Schedule",
          payload: "SCHEDULE",
        },
      ],
    });
  }
  if (payload) {
    if (user) {
      switch (payload) {
        case "UNSUBSCRIBE":
          await facebookUserController.removeFacebookUser(senderPSID);
          return await callSendAPI(senderPSID, {
            text: "Subscription Removed!\nIf you ever wanted to subscribe again don't hesitate to message me!",
          });
        case "SETTINGS_UPDATE":
          return await callSendAPI(senderPSID, {
            text: "What would you like to update?",
            quick_replies: [
              {
                content_type: "text",
                title: "Language",
                payload: "CHANGE_LANG",
              },
              {
                content_type: "text",
                title: "Dueling Formats",
                payload: "CHANGE_FORMATS",
              },
              {
                content_type: "text",
                title: "Cancel",
                payload: "END",
              },
            ],
          });
        case "CHANGE_LANG":
          return await callSendAPI(senderPSID, {
            text: "Please Choose your Preferred Language.",
            quick_replies: [
              {
                content_type: "text",
                title: "English",
                payload: "CHANGE_LANG_EN",
              },
              {
                content_type: "text",
                title: "Cancel",
                payload: "END",
              },
            ],
          });
        case "CHANGE_LANG_EN":
          return await callSendAPI(senderPSID, {
            text: "Language changed! Message me again if you need anyhting else.",
          });
        case "SCHEDULE": {
          const user = await facebookUserController.getFacebookUser(senderPSID);
          const tournaments = await tournamentController.getAllTournaments();
          let message = "-No tournaments avaliable.";
          if (user && tournaments) {
            const filtredTournaments = tournaments
              ?.filter((tour) => {
                return user.config.following.some((item) => tour.tags.includes(item));
              })
              .filter((tour) => {
                const date = Date.now();
                if (tour.date > date) return true;
                return false;
              })
              .sort((a, b) => {
                if (a.date > b.date) return 1;
                if (a.date < b.date) return -1;
                return 0;
              })
              .map((tournament) => {
                let format = "Unknown";
                if (tournament.tags.includes("rd")) {
                  format = "Rush Duel";
                } else if (tournament.tags.includes("sd")) {
                  format = "Speed Duel";
                } else if (tournament.tags.includes("md")) {
                  format = "Master Duel";
                }
                return {
                  date: tournament.date,
                  string: `${tournament.title} (${format}): ${tournament.url}`,
                };
              });
            message = groupAndFormatByDay(filtredTournaments);
          }

          return await callSendAPI(senderPSID, {
            text: `${message}`,
          });
        }

        case "CHANGE_FORMATS": {
          const user = await facebookUserController.getFacebookUser(senderPSID);
          const following: string = convertUserTags(user?.config.following);
          return await callSendAPI(senderPSID, {
            text: `Please Select a format to Follow/Unfollow, you are currently following:\n\n${following}`,
            quick_replies: [
              {
                content_type: "text",
                title: "Master Duel",
                payload: "CHANGE_FORMAT_MD",
              },
              {
                content_type: "text",
                title: "Speed Duel",
                payload: "CHANGE_FORMAT_SD",
              },
              {
                content_type: "text",
                title: "Rush Duel",
                payload: "CHANGE_FORMAT_RD",
              },
              {
                content_type: "text",
                title: "Finish",
                payload: "END",
              },
            ],
          });
        }
        case "CHANGE_FORMAT_MD": {
          const user = await facebookUserController.getFacebookUser(senderPSID);
          const updatedUser = await toggleUserTag(user, "md");
          const following: string = convertUserTags(updatedUser?.config.following);
          return await callSendAPI(senderPSID, {
            text: `Got it! Please Select a format to Follow/Unfollow, you are currently following:\n\n${following}`,
            quick_replies: [
              {
                content_type: "text",
                title: "Master Duel",
                payload: "CHANGE_FORMAT_MD",
              },
              {
                content_type: "text",
                title: "Speed Duel",
                payload: "CHANGE_FORMAT_SD",
              },
              {
                content_type: "text",
                title: "Rush Duel",
                payload: "CHANGE_FORMAT_RD",
              },
              {
                content_type: "text",
                title: "Finish",
                payload: "END",
              },
            ],
          });
        }

        case "CHANGE_FORMAT_SD": {
          const user = await facebookUserController.getFacebookUser(senderPSID);
          const updatedUser = await toggleUserTag(user, "sd");
          const following: string = convertUserTags(updatedUser?.config.following);
          return await callSendAPI(senderPSID, {
            text: `Got it! Please Select a format to Follow/Unfollow, you are currently following:\n\n${following}`,
            quick_replies: [
              {
                content_type: "text",
                title: "Master Duel",
                payload: "CHANGE_FORMAT_MD",
              },
              {
                content_type: "text",
                title: "Speed Duel",
                payload: "CHANGE_FORMAT_SD",
              },
              {
                content_type: "text",
                title: "Rush Duel",
                payload: "CHANGE_FORMAT_RD",
              },
              {
                content_type: "text",
                title: "Finish",
                payload: "END",
              },
            ],
          });
        }

        case "CHANGE_FORMAT_RD":
          const user = await facebookUserController.getFacebookUser(senderPSID);
          const updatedUser = await toggleUserTag(user, "rd");
          const following: string = convertUserTags(updatedUser?.config.following);
          return await callSendAPI(senderPSID, {
            text: `Got it! Please Select a format to Follow/Unfollow, you are currently following:\n\n${following}`,
            quick_replies: [
              {
                content_type: "text",
                title: "Master Duel",
                payload: "CHANGE_FORMAT_MD",
              },
              {
                content_type: "text",
                title: "Speed Duel",
                payload: "CHANGE_FORMAT_SD",
              },
              {
                content_type: "text",
                title: "Rush Duel",
                payload: "CHANGE_FORMAT_RD",
              },
              {
                content_type: "text",
                title: "Finish",
                payload: "END",
              },
            ],
          });
        case "END":
          return await callSendAPI(senderPSID, {
            text: "Got it! Message me again if you need to adjust anything.",
          });
      }
    } else {
      if (payload == "SUBSCRIBE") {
        await facebookUserController.createFacebookUser({
          id: senderPSID,
          config: { language: "en", following: ["rd", "sd", "md"] },
        });
        return await callSendAPI(senderPSID, { text: "Subscription Complete!" });
      }
    }
    return await callSendAPI(senderPSID, { text: "Unknown option, please try again!" });
  }
  return await callSendAPI(senderPSID, {
    text: "Hello!\nI'm DataStorm, a Bot that notifies you everytime a Yu-Gi-Oh! Digital Tournament is announced, Please enter the subscribe button below if you wish to get notified!\n\nIf you have any suggestions or want to report an issue, please contact the developer using one of these methods:\n-Discord:PlaymakerEY\n-Email:PlaymakerEY@gmail.com",
    quick_replies: [
      {
        content_type: "text",
        title: "Subscribe",
        payload: "SUBSCRIBE",
      },
    ],
  });
}
const webhookRouter = express.Router();

webhookRouter.post("/", async (req, res) => {
  const webhookEvent = req.body.entry?.[0]?.messaging?.[0];
  try {
    await handleWebhookEvent(webhookEvent);
  } catch (error) {
    console.log(error);
  }
  res.status(200).send("RECIVED");
});

webhookRouter.get("/", (req, res) => {
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode is in the query string of the request
  if (mode && token) {
    // Check the mode and token sent is correct
    if (mode === "subscribe" && token === process.env.MESSENGER_VERIFY_TOKEN) {
      // Respond with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

export default webhookRouter;
export { callSendAPI };
