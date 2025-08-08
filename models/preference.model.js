const mongoose = require("mongoose");

const preferanceSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    age_preference: {
        from: Number,
        to: Number,
    },
    height_preference: String,
    education_preference: String,
    family_background_preference: String,
    personal_income_preference: String,
    marriage_status_preference: String,
    religion_preference: Array,
    preferred_location: String,
}, {timestamps: true});

module.exports = new mongoose.model("preference", preferanceSchema);
