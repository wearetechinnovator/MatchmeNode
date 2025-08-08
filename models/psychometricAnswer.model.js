const mongoose = require("mongoose");

const psychometricAnswerSchema = new mongoose.Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    qa: {
        type: Array,
        required: true,
    },
    categoryCount: Array
})


module.exports = mongoose.model("PsychometricAnswer", psychometricAnswerSchema);
