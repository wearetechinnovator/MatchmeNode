const mongoose = require("mongoose");

const messageArr = new mongoose.Schema({
    message: String,
    message_by: {
        type: String,
        enum: ['admin', 'user']
    },
    readStatus: {
        type: Boolean,
        default: false
    }
}, { _id: false });


const chatSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    Qtype: String,
    message: [messageArr]

}, { timestamps: true });

module.exports = new mongoose.model("adminchat", chatSchema);

