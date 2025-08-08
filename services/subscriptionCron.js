const cron = require("node-cron");
const usersModel = require("../models/users.model");
const moment = require("moment-timezone")



const kolkataNow = moment().tz('Asia/Kolkata').toDate();
const checkSubscription = cron.schedule("0 0 * * *",
    async () => {
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
        timezone: "Asia/Kolkata",
    });


module.exports = checkSubscription;
