const admin = require("firebase-admin");
const serviceAccount = require("../firebase_private_key.json");
const notificationModel = require("../models/notification.model");
const moment = require("moment-timezone")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const sendNotification = async ({ tokens, title, body, userId, type }) => {
    const kolkataTime = new Date();

    try {
        const response = await admin.messaging().sendEachForMulticast({
            tokens: tokens,
            notification: {
                title,
                body,
            },

            data: {
                customKey: type,
            },
        });

        if (response) {
            const data = {
                ...(userId && { user_id: userId }),
                message: body,
                date: kolkataTime,
                notify_type: type
            }
            await notificationModel.create(data);
        }

        console.log("Notification sent successfully:", response);
    } catch (error) {
        console.error("Error sending notification:", error);
    }

}

module.exports = sendNotification;
