const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    message: String,
    notify_type: {
        type: String,
        enum: ["interest", "connection", "match", "message", "generic"],
    },
    date: Date
}, { timestamps: true });

module.exports = new mongoose.model("notification", notificationSchema);
