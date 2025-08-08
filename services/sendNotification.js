const admin = require("firebase-admin");
const serviceAccount = require("../firebase_private_key.json");
const notificationModel = require("../models/notification.model");
const moment = require("moment-timezone")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const sendNotification = async ({ token, title, body, userId, type }) => {
    const kolkataTime = moment().tz("Asia/Kolkata").toDate();
    // Ensure tokens is an array
    const tokens = Array.isArray(token) ? [...token] : token;
    console.log(tokens)

    try {

        // const data = {
        //     ...(userId && { user_id: userId }),
        //     message: body,
        //     date: kolkataTime,
        //     notify_type: type
        // }
        // await notificationModel.create(data);

        const response = await admin.messaging().send({
            token: tokens,
            notification: {
                title,
                body,
            },

            data: {
                customKey: "customValue",
            },
        });
        console.log("Notification sent successfully:", response);
    } catch (error) {
        console.error("Error sending notification:", error);
    }

}

module.exports = sendNotification;
