const psychometricAnswerModel = require("../models/psychometricAnswer.model");
const psychometricQuestionModel = require('../models/psychometricQuestion.model');
const usersModel = require("../models/users.model");


const add = async (req, res) => {
    const { questionAnswer } = req.body;

    // Check requirement;
    if (!questionAnswer || questionAnswer.length === 0) {
        return res.status(500).json({ err: 'require all fields' });
    }

    try {
        const userData = req.userData; //come from middleware
        const categoryCount = { A: 0, B: 0, C: 0, D: 0, E: 0 };

        questionAnswer.forEach(q => {
            q.options.forEach(opt => {
                opt.categories.forEach(cat => {
                    if (categoryCount.hasOwnProperty(cat)) {
                        categoryCount[cat]++;
                    }
                });
            });
        });

        // Find the category with the maximum count
        let maxCategory = null;
        let maxCount = -1;

        for (const [category, count] of Object.entries(categoryCount)) {
            if (count > maxCount) {
                maxCount = count;
                maxCategory = category;
            }
        }


        // insert data;
        const insert = await psychometricAnswerModel.create({ user_id: userData._id, qa: questionAnswer, categoryCount });
        const update = await usersModel.updateOne({ _id: userData._id }, {
            $set: {
                psychometric_test: true,
                psychometric_category: maxCategory
            }
        });

        if (!insert) {
            return res.status(500).json({ err: "Psychometric not insert" });
        }

        console.log(insert);
        return res.status(200).json(insert);


    } catch (error) {
        console.log(error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}


// Get all psychometric questions;
const get = async (req, res) => {
    try {
        const userData = req.userData; //come from middleware

        // get data;
        const getData = await psychometricQuestionModel.find();

        if (!getData) {
            return res.status(500).json({ err: "Psychometric not found" });
        }

        return res.status(200).json(getData);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ err: "Something went wrong" });
    }
}



module.exports = {
    add, get
}
