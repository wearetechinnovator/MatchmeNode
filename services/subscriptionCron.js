const cron = require("node-cron");
const usersModel = require("../models/users.model");
const moment = require("moment-timezone");


const checkSubscription = cron.schedule(
  "0 0 * * *", // every midnight
  async () => {
    // calculate "now" fresh each time in IST, then convert to UTC
    const kolkataNow = moment.tz("Asia/Kolkata").utc().toDate();

    await usersModel.updateMany(
      {
        is_subscribed: true,
        subscription_end_date: { $lt: kolkataNow },
      },
      {
        $set: { is_subscribed: false },
      }
    );

  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata", // cron fires at 00:00 IST
  }
);

module.exports = checkSubscription;
