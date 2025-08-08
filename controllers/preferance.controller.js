const preferenceModel = require("../models/preference.model");


// Add and Update controller
const add = async (req, res) => {
    const { age_preference, height_preference, education_preference, family_background_preference,
        personal_income_preference, marriage_status_preference, religion_preference,
        preferred_location, update
    } = req.body;



    // Check requirement;
    if ([age_preference, height_preference, education_preference, family_background_preference,
        personal_income_preference, marriage_status_preference, religion_preference,
        preferred_location].some((field) => !field || field == "") && update === false) {

        return res.status(500).json({ err: 'require all fields' })
    }

    try {
        const userData = req.userData; //come from middleware

        // Update preferance;
        if (update === true) {
            const update = await preferenceModel.updateOne({ user_id: userData._id }, {
                $set: {
                    age_preference, height_preference, education_preference, family_background_preference,
                    personal_income_preference, marriage_status_preference, religion_preference,
                    preferred_location
                }
            });

            if (update.modifiedCount < 1) {
                return res.status(500).json({ err: "Preferance update failed" });
            }

            return res.status(200).json(update)
        }

        // insert data;
        const insert = await preferenceModel.create({
            age_preference, height_preference, education_preference, family_background_preference,
            personal_income_preference, marriage_status_preference, religion_preference,
            preferred_location, user_id: userData._id
        })

        if (!insert) {
            return res.status(500).json({ err: "Preferance not insert" });
        }

        return res.status(200).json(insert);


    } catch (error) {
        console.log(error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}


// Get Controller All data and specific data;
const get = async (req, res) => {
    const { fieldsArr } = req.body;
    const userData = req.userData;

    try {
        // Build query
        let query = preferenceModel.findOne({ user_id: userData._id });

        // Add select clause if specific fields requested
        if (fieldsArr && Array.isArray(fieldsArr)) {
            const selectFields = fieldsArr.join(" ");
            query = query.select(selectFields)

        }

        const data = await query;

        if (!data) {
            return res.status(404).json({ err: "User data not found" });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}


const remove = async (req, res) => {
    const userData = req.userData;

    try {
        const del = await preferenceModel.deleteOne({ user_id: userData._id });

        if (del.deletedCount === 0) {
            return res.status(404).json({ message: "No preference found to delete" });
        }

        return res.status(200).json({ message: "Preference deleted successfully" });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}


module.exports = {
    add, get, remove
}
