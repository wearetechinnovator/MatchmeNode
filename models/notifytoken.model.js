const mongoose = require("mongoose");

const notifyTokenSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    fcmTokens: Array
}, {timestamps: true});

module.exports = new mongoose.model("notifytoken", notifyTokenSchema);
