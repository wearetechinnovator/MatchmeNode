const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema({
    user_1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
     user_2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },

    date: Date
}, {timestamps: true})



module.exports = new mongoose.model("connection", connectionSchema);
