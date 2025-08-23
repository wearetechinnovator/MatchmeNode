const mongoose = require("mongoose");

const matchCronSchema = new mongoose.Schema({
    cron_type: {
        type: String,
        enum: ['weekday', 'date'],
        default: 'weekday'
    },
    date: Date,
    number_of_match: Number,
    week_day: {
        type: String,
        enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    time: String

},{timestamps: true})


module.exports = new mongoose.model("matchcron", matchCronSchema);