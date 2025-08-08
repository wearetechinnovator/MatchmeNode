const mongoogse = require("mongoose");


const psychometricQuestionSchema = new mongoogse.Schema({
    question: {
        type: String,
        required: true,
    },
    options: {
        type: Array,
        required: true,
    },
})

module.exports = mongoogse.model("PsychometricQuestion", psychometricQuestionSchema);
