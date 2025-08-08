const notificationModel = require("../models/notification.model");
const notifytokenModel = require("../models/notifytoken.model");
const moment = require("moment-timezone");


const addToken = async (req, res) => {
    const userData = req.userData;
    const { fcmToken } = req.body;
    

    if (!fcmToken) {
        return res.status(500).json({ err: "FCM token required" });
    }

    try {
        const insert = await notifytokenModel.updateOne(
            { user_id: userData._id },
            {
                $addToSet: { fcmTokens: fcmToken }
            },
            { upsert: true }
        );

        if (!insert) {
            return res.sendStatus(500)
        }

        return res.sendStatus(200)

    } catch (error) {
        console.error("FCM Token Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}

// Get FCM Token;
const getToken = async (userId) => {
    try {
        
        const result = await notifytokenModel.findOne({ user_id: userId },{ user_id: 0, _id: 0 });
        
        return result.fcmTokens; // Send only toke Array

    } catch (error) {
        console.error("Error:", error);
        return false;
    }
}



const add = async (req, res) => {
    const userData = req.userData;
    const { msg, type } = req.body;
    const kolkataTime = moment().tz("Asia/Kolkata").toDate();

    if (!msg) {
        return res.status(500).json({ err: "FCM token required" });
    }

    try {
        const insert = await notificationModel.create({
            user_id: userData._id,
            message: msg,
            date: kolkataTime,
            notify_type: type
        });

        if (!insert) {
            return res.sendStatus(500)
        }

        return res.sendStatus(200)

    } catch (error) {
        console.error("FCM Token Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}


const get = async (req, res) => {
    const userData = req.userData;

    try {
        const allNotification = await notificationModel.find({
            $or: [
                { user_id: userData._id },                 // Match specific user ID
                { user_id: { $exists: false } },           // Field is missing
                { user_id: null }                          // Field is explicitly null
            ]
        });
        if (!allNotification) {
            return res.status(400).json({ err: "No notification found" });
        }

        const formattedNotifications = allNotification.map(notification => {
            // Convert both dates to Asia/Kolkata time
            const date = moment.tz(notification.date, "Asia/Kolkata");
            const now = moment.tz("Asia/Kolkata");

            const diffSeconds = now.diff(date, 'seconds');
            const diffMinutes = now.diff(date, 'minutes');
            const diffHours = now.diff(date, 'hours');
            const diffDays = now.diff(date, 'days');

            let timeAgo = "";

            if (diffSeconds < 60) {
                timeAgo = `${diffSeconds}s ago`;
            } else if (diffMinutes < 60) {
                timeAgo = `${diffMinutes}m ago`;
            } else if (diffHours < 24) {
                timeAgo = `${diffHours}h ago`;
            } else if (diffDays === 1) {
                timeAgo = `Yesterday`;
            } else if (diffDays <= 7) {
                timeAgo = `${diffDays}d ago`;
            } else {
                timeAgo = date.format("DD MMM YYYY"); // e.g., 06 Aug 2025
            }

            return {
                ...notification._doc,
                timeAgo
            };
        });

        return res.status(200).json(formattedNotifications);


    } catch (error) {
        console.error("Notification Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}



module.exports = {
    addToken, getToken,
    add, get
}
