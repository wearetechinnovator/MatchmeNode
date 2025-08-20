const matchModel = require("../models/matches.model");
const userModel = require("../models/users.model");
const preferenceModel = require("../models/preference.model");
const matchesFunction = require("../helper/getDateRange");
const moment = require("moment-timezone");
const sendNotification = require("../services/sendNotification");
const { getToken } = require("./notification.controller");


const add = async () => {
    const kolkataTime = moment().tz("Asia/Kolkata").toDate();

    try {
        const allUser = await userModel.find({
            is_subscribed: true, is_del: false, registration_status: "1",psychometric_test:true
        });

        for (let user of allUser) {

            //Get Preference
            const getPref = await preferenceModel.findOne({ user_id: user._id });

            // Age
            const { fromDob, toDob } = matchesFunction.getDobRangeFromAge(getPref.age_preference.from, getPref.age_preference.to);

            //Genger 
            const prefGender = user.gender == "Male" ? "Female" : (user.gender == "Female" ? "Male" : "Other");

            //Height
            const { fromHeight, toHeight } = matchesFunction.getHeightRange(getPref.height_preference);

            //Education
            const educationFilter = getPref.education_preference === "Any"
                ? {}
                : { highest_qualification: { $in: [getPref.education_preference] } };

            // Family background;
            let familyBg = [];
            if (getPref.family_background_preference === "Any") {
                familyBg = [
                    "Business owners",
                    "Goverment employees",
                    "Private employees",
                    "Self-employed",
                    "Retired",
                    "Others"
                ];
            }
            else if (getPref.family_background_preference === "Business") {
                familyBg = ["Business owners"];
            }
            else if (getPref.family_background_preference === "Service") {
                familyBg = [
                    "Business owners",
                    "Goverment employees",
                    "Private employees",
                    "Self-employed",
                    "Retired"
                ];
            }

            // Marital Status;
            let maritalStatus = [];
            if (getPref.marriage_status_preference === "Any") {
                maritalStatus = ["Never Married", "Divorced", "Widowed"];
            }
            else {
                maritalStatus = [getPref.marriage_status_preference];
            }

            // Location;
            let prefLoc = [];
            if (getPref.preferred_location === "Any where") {
                prefLoc = ["Indian", "NRI"];
            }
            else if (getPref.preferred_location === "India") {
                prefLoc = ["Indian"];
            }
            else if (getPref.preferred_location === "Abroad") {
                prefLoc = ["NRI"];
            }

            // Income;
            const prefIncome = [
                "Any",
                "Under 10 Lakhs",
                "10 Lakhs and Above",
                "20 Lakhs and Above",
                "30 Lakhs and Above",
                "40 Lakhs and Above",
                "50 Lakhs and Above",
                "60 Lakhs and Above",
                "70 Lakhs and Above",
                "80 Lakhs and Above",
                "90 Lakhs and Above",
                "1 Crore and Above",
                "5 Crore and Above",
            ];
            const income = getPref.personal_income_preference;
            const index = prefIncome.indexOf(income);
            const filteredIncome = index !== -1 ? prefIncome.slice(index) : [];


            // Custom Order
            const orderMap = {
                A: ["C", "D", "B", "E", "A"],
                B: ["C", "E", "A", "D", "B"],
                C: ["B", "A", "E", "C", "D"],
                D: ["A", "E", "B", "C", "D"],
                E: ["E", "B", "D", "C", "A"]
            };
            const customOrder = orderMap[user.psychometric_category] || ["A", "B", "C", "D", "E"];


            const matches = await userModel.aggregate([
                {
                    $match: {
                        _id: { $ne: user._id },
                        is_subscribed: true,
                        psychometric_test:true,
                        is_del: false,
                        registration_status: "1",
                        gender: prefGender,
                        dob: { $gte: fromDob, $lte: toDob },
                        height: { $gte: fromHeight, $lte: toHeight },
                        ...educationFilter,
                        family_background: { $in: familyBg },
                        marital_status: { $in: maritalStatus },
                        religion: { $in: getPref.religion_preference },
                        nationality: { $in: prefLoc },
                        personal_anual_income: { $in: filteredIncome }
                    }
                },
                {
                    $addFields: {
                        categoryOrder: {
                            $indexOfArray: [customOrder, "$psychometric_category"]
                        }
                    }
                },
                {
                    $sort: {
                        categoryOrder: 1 // ascending based on custom order
                    }
                },
                {
                    $limit: 3 // only first 3 results
                },
                {
                    $project: {
                        _id: 1,

                        full_name: 1,
                        whatsapp_number: 1,
                        user_name: 1,
                        psychometric_category: 1,
                        gender : 1,
                        dob : 1,
                        height : 1,
                        family_background : 1,
                        highest_qualification : 1,
                        marital_status : 1,
                        nationality : 1,
                        religion : 1,
                        personal_anual_income : 1
                    },
                }
            ]);


            // 1. Get existing match_user_ids for the user
            const existingMatchDoc = await matchModel.findOne(
                { user_id: user._id },
                { matches: 1 }
            );

            const existingMatchUserIds = new Set(
                (existingMatchDoc?.matches || []).map(match => match.match_user_id.toString())
            );

            // 2. Filter out already existing match_user_ids
            const filteredMatch = matches
                .filter(item => !existingMatchUserIds.has(item._id.toString()))
                .map(item => ({
                    match_user_id: item._id,
                    match_date: kolkataTime,
                    interest_send: "pending",
                    status: "pending"
                }));

            // 3. Add only new matches (no update if none)
            if (filteredMatch.length > 0) {
                await matchModel.updateOne(
                    { user_id: user._id },
                    {
                        $addToSet: {
                            matches: { $each: filteredMatch }
                        }
                    },
                    { upsert: true }
                );


                // ::::::::::::::::::::::: Send and Store Notification :::::::::::::::::;
                const FCMtoken = await getToken(user._id);
                await sendNotification({
                    tokens: FCMtoken,
                    userId: user._id,
                    title: "You have a new match!",
                    body: `You matched with ${filteredMatch.length} profiles}.`,
                    type: "match"
                });
            }

        }

        // testing...
        // return res.json({ "success": true })


    } catch (error) {
        console.log(error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}


const get = async (req, res) => {
    const userData = req.userData;

    try {
        let query = await matchModel.findOne({
            user_id: userData._id
        }).populate("matches.match_user_id");

        if (!query) {
            return res.status(500).json({ err: "No data found" });
        }

        let filterData = query.matches.filter((q, _) => q.interest_send === "pending");
        query['matches'] = filterData.reverse();

        return res.status(200).json(query);

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }

};


module.exports = {
    add, get
}
