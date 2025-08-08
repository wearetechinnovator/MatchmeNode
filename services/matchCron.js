const cron = require("node-cron");
const moment = require("moment-timezone");
const matchCronModel = require("../models/matchCron.model");
const { add } = require("../controllers/match.controller");


const matchCron = async () => {
    const cronTime = await matchCronModel.findOne();
    const weekDayMap = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
    };

    let scheduleExpersion;
    if (cronTime.cron_type === "weekday") {
        scheduleExpersion = `${cronTime.time.split(":")[1] || 0} ${cronTime.time.split(":")[0] || 0} * * ${weekDayMap[cronTime.week_day]}`;
    }

    const kolkataNow = moment().tz('Asia/Kolkata').toDate();
    cron.schedule(scheduleExpersion,
        async () => {
            await add();
            console.log("[*] Match Generate");
        },
        {
            scheduled: true,
            timezone: "Asia/Kolkata",
        }
    );

}



module.exports = { matchCron };
