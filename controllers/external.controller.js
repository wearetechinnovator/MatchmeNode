const matchCronModel = require("../models/matchCron.model");
const { matchCron } = require("../services/matchCron");
const moment = require("moment-timezone");
const sendNotification = require("../services/sendNotification");
const { getToken } = require("./notification.controller");
const notifytokenModel = require("../models/notifytoken.model");
const usersModel = require("../models/users.model");
const preferenceModel = require("../models/preference.model");
const psychometricAnswerModel = require("../models/psychometricAnswer.model");
const matchesModel = require("../models/matches.model");
const connectionModel = require("../models/connection.model");
const passwordGenerator = require("../helper/passGen");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");


// ::::::::::: USER REGISTER ::::::::::::
const register = async (req, res) => {
    const {
        whatsapp_number, email, full_name, nick_name, user_name, password,
        gender, dob, birth_time, birth_place, pin_code, country, locality, address,
        nationality, nationality_details, religion, community, medical_history, height,
        weight, marital_status, should_weight_display_on_profile, do_have_kids, father_name,
        mother_name, father_occupation, mother_occupation, no_of_siblings, sibling_details,
        family_background, family_description, family_anual_income, highest_qualification,
        school_name, ug_college_name, pg_college_name, phd_college_name,
        other_qualification_details, highest_degree, hometown, nature_of_work, industry,
        organization, designation, personal_anual_income, business_turnover,
        business_website, profile_picture, family_picture, full_body_picture, fun_picture,
        user_type, eating_preferences, how_often_you_drink, are_you_a_smoker,
        how_often_you_workout, favourite_weekend_activities, holidays_prefrences,
        how_often_you_eat_out, how_often_you_travel, prefered_social_event, city,
        whom_do_you_like_going_out_with, how_spiritual_are_you, how_religious_are_you,
        about_yourself, marital_status_from_year, marital_status_to_year,
        subscription_end_date, is_subscribed, category, interests
    } = req.body;


    // Check requires;
    if ([full_name, whatsapp_number, password, user_name].some((field) => !field || field == "")) {
        return res.status(500).json({ err: "fill the require" });
    }


    try {
        // Check existance of email and phone number;
        const isEmailExist = await usersModel.findOne({ email });
        const isPhoneExist = await usersModel.findOne({ whatsapp_number });
        const isUserExist = await usersModel.findOne({ user_name });

        if (isEmailExist) {
            return res.status(500).json({ err: "Email already exist" });
        }

        if (isUserExist) {
            return res.status(500).json({ err: "Username not available" });
        }

        if (isPhoneExist) {
            return res.status(500).json({ err: "Whatsapp number already exist" });
        }

        // insert data
        const insert = await usersModel.create({
            user_name, password, whatsapp_number, email, full_name, nick_name,
            gender, dob, birth_time, birth_place, pin_code, country, locality, address,
            nationality, nationality_details, religion, community, medical_history, height,
            weight, marital_status, should_weight_display_on_profile, do_have_kids, father_name,
            mother_name, father_occupation, mother_occupation, no_of_siblings, sibling_details,
            family_background, family_description, family_anual_income, highest_qualification,
            school_name, ug_college_name, pg_college_name, phd_college_name,
            other_qualification_details, highest_degree, hometown, nature_of_work, industry,
            organization, designation, personal_anual_income, business_turnover,
            business_website, profile_picture, family_picture, full_body_picture, fun_picture,
            user_type, eating_preferences, how_often_you_drink, are_you_a_smoker,
            how_often_you_workout, favourite_weekend_activities, holidays_prefrences,
            how_often_you_eat_out, how_often_you_travel, prefered_social_event, city,
            whom_do_you_like_going_out_with, how_spiritual_are_you, how_religious_are_you,
            about_yourself, marital_status_from_year, marital_status_to_year,
            subscription_end_date, is_subscribed, category, interests
        });

        if (!insert) {
            return res.status(500).json({ err: "User not register" });
        }

        return res.status(200).json({
            message: "User created successfully"
        })


    } catch (error) {
        console.log(error)
        return res.status(500).json({ err: "Something went wrong" })
    }

}


// :::::::::: Match CRON Setup ::::::::::
const matchCronSetup = async (req, res) => {
    try {
        const { week_day, time, number_of_match } = req.body;

        if ([week_day, time, number_of_match].some((field) => !field || field == "")) {
            return res.status(400).json({ err: "Require all fields" });
        }

        const updateData = {
            time,
            number_of_match,
            week_day
        };

        const updatedDoc = await matchCronModel.findOneAndUpdate(
            {}, // empty filter since you want to update the only document
            updateData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Re-schedule after update
        matchCron();

        return res.status(200).json({ message: "Match cron setup updated successfully." });

    } catch (error) {
        console.error("Error setting up match cron:", error);
        return res.status(500).json({ err: "Internal server error." });
    }

};


// :::::::::::::::: Get Match CRON ::::::::::::::::
const getMatchCron = async (req, res) => {
    try {
        const getData = await matchCronModel.find({}, { week_day: 1, time: 1, number_of_match: 1 });

        if (!getData || getData.length === 0) {
            return res.status(404).json({ err: "No CRON found" });
        }

        res.status(200).json(getData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ err: "Unable to fetch CRON data" });
    }
}



// All User Count
const allUserCount = async (req, res) => {
    // Convert type to number or default to 1
    let type = parseInt(req?.body?.type) || 1;// 1 = all; 2 = true; 3 = false

    try {
        let count;

        if (type === 1) {
            count = await usersModel.countDocuments({ is_del: false });
        } else if (type === 2) {
            count = await usersModel.countDocuments({ is_subscribed: true, is_del: false });
        } else if (type === 3) {
            count = await usersModel.countDocuments({ is_subscribed: false, is_del: false });
        } else {
            return res.status(400).json({ err: "Invalid type value." });
        }

        return res.status(200).json({ count });

    } catch (error) {
        console.error("Error fetching user count:", error);
        return res.status(500).json({ err: "Internal server error." });
    }
};


// ::::::::::: CHANGE SUBSCRIPTION STATUS ::::::::::::
const changeSubscriptionStatus = async (req, res) => {
    const { userId, endDate, status } = req.body;
    const endDateUTC = moment.tz(endDate, "YYYY-MM-DD", "Asia/Kolkata").utc().toDate();

    console.log(endDateUTC);

    if (!userId || !status) {
        return res.status(500).json({ err: "Userid and Status can't be blank" });
    }

    if (status === true && !endDate) {
        return res.status(500).json({ err: "End date required" })
    }

    try {
        const update = await usersModel.updateOne({ _id: userId, is_del: false }, {
            $set: {
                is_subscribed: status == 1 ? true : false,
                subscription_end_date: endDateUTC
            }
        });

        if (update.modifiedCount < 1) {
            return res.status(500).json({ err: "Update subscription failed" })
        }

        return res.status(200).json({ message: "Subscription change successfully" });

    } catch (error) {
        console.log("Error: ", error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}


// ::::::::::: DELETE USER ::::::::::::
const deleteUser = async (req, res) => {
    let { userId } = req.body;

    if (!userId) {
        return res.status(500).json({ err: "Userid can't be blank" });
    }

    try {
        const result = await usersModel.updateOne({ _id: userId }, {
            $set: {
                is_del: true
            }
        });


        if (result.modifiedCount < 1) {
            return res.status(500).json({ err: "Unable to delete" });
        }

        return res.status(200).json({ message: "User deleted" });

    } catch (error) {
        console.log("Error: ", error);
        return res.status(500).json({ err: "Something went wrong" });
    }
}


// ::::::::::: GET ALL USER ::::::::::::
const getAllUser = async (req, res) => {
    try {
        // Parse request body values safely
        const {
            type = 1, // 1 = all, 2 = subscribed, 3 = unsubscribed
            page = 1,
            limit = 10,
            searchQuery = ""
        } = req.body;

        const parsedType = parseInt(type);
        const parsedPage = Math.max(1, parseInt(page));
        const parsedLimit = Math.max(1, parseInt(limit));
        const skip = (parsedPage - 1) * parsedLimit;

        // Base filter
        let filter = { is_del: false };

        // Apply subscription filter
        if (parsedType === 2) {
            filter.is_subscribed = true;
        } else if (parsedType === 3) {
            filter.is_subscribed = false;
        } else if (parsedType !== 1) {
            return res.status(400).json({ err: "Invalid type value." });
        }

        // Apply search filter only if provided
        if (searchQuery && searchQuery.trim() !== "") {
            filter.$or = [
                { whatsapp_number: { $regex: searchQuery, $options: "i" } },
                { user_name: { $regex: searchQuery, $options: "i" } },
                { full_name: { $regex: searchQuery, $options: "i" } },
                { email: { $regex: searchQuery, $options: "i" } }
            ];

            // Try to match ObjectId if search is valid ObjectId
            if (mongoose.Types.ObjectId.isValid(searchQuery)) {
                filter.$or.push({ _id: searchQuery });
            }
        }

        // Fetch data
        const [count, users] = await Promise.all([
            usersModel.countDocuments(filter),
            usersModel.find(filter)
                .skip(skip)
                .limit(parsedLimit)
                .sort({ createdAt: -1 })
        ]);

        return res.status(200).json({
            page: parsedPage,
            limit: parsedLimit,
            totalUsers: count,
            totalPages: Math.ceil(count / parsedLimit),
            users,
        });

    } catch (error) {
        console.error("Error fetching users with pagination:", error);
        return res.status(500).json({ err: "Internal server error." });
    }
};




// ::::::::::: GET SINGLE USER ::::::::::::
const getUserDetails = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(500).json({ err: "user id is required" });
    }

    try {

        const userDetails = await usersModel.findOne({ _id: userId, is_del: false });
        const userPreference = await preferenceModel.findOne({ user_id: userId });
        const userPsycho = await psychometricAnswerModel.findOne({ user_id: userId });

        return res.status(200).json({
            userDetails,
            userPreference,
            userPsycho
        });

    } catch (error) {
        console.error("Error fetching user data:", error);
        return res.status(500).json({ err: "Internal server error." });
    }
};


// ::::::::::: GET MATCHES OF A USER ::::::::::::
const getMatches = async (req, res) => {
    const { userId, fromDate, toDate } = req.body;

    if (!userId) {
        return res.status(400).json({ err: "User id required" });
    }

    // Send all matches
    if (!fromDate && !toDate) {
        const query = await matchesModel.findOne({ user_id: userId }).populate("matches.match_user_id");

        if (!query) {
            return res.status(404).json({ err: "No data found" });
        }

        return res.status(200).json(query);
    }


    const fromDateKolkata = moment(fromDate).tz('Asia/Kolkata').startOf('day').utc().toDate();
    const toDateKolkata = moment(toDate).tz('Asia/Kolkata').endOf('day').utc().toDate();


    try {
        // Fetch the user's matches document
        let query = await matchesModel.findOne({
            user_id: userId,
            matches: {
                $elemMatch: {
                    $or: [
                        { match_date: { $gte: fromDateKolkata, $lte: toDateKolkata } },
                        { match_date: { $exists: false } }
                    ]
                }
            }
        }).populate("matches.match_user_id");

        if (!query) {
            return res.status(404).json({ err: "No data found" });
        }

        // Filter matches with pending interest_send
        const filteredMatches = query.matches.filter(
            m => m.interest_send === "pending" 
        );

        query.matches = filteredMatches.reverse();

        return res.status(200).json(query);

    } catch (error) {
        console.error("Error fetching matches:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }
};



// :::::::::::: GET Connection of user ::::::::::::
const getConnection = async (req, res) => {
    const { userId, fromDate, toDate } = req.body;

    if (!userId) {
        return res.status(400).json({ err: "User id required" });
    }

    const fromDateKolkata = moment(fromDate).tz('Asia/Kolkata').startOf('day').utc().toDate();
    const toDateKolkata = moment(toDate).tz('Asia/Kolkata').endOf('day').utc().toDate();

    try {
        const result = await connectionModel.aggregate([
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { user_1: new mongoose.Types.ObjectId(userId) },
                                { user_2: new mongoose.Types.ObjectId(userId) },
                            ]
                        },
                        {
                            date: {
                                $gte: fromDateKolkata,
                                $lte: toDateKolkata
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    other_user_id: {
                        $cond: {
                            if: { $eq: ["$user_1", new mongoose.Types.ObjectId(userId)] },
                            then: "$user_2",
                            else: "$user_1"
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users", // replace with your actual MongoDB collection name if different
                    localField: "other_user_id",
                    foreignField: "_id",
                    as: "other_user"
                }
            },
            {
                $unwind: "$other_user"
            },
            {
                $replaceRoot: { newRoot: "$other_user" }
            }
        ]);

        if (!result || result.length === 0) {
            return res.status(404).json({ err: "No Connection Available" });
        }

        return res.status(200).json(result);

    } catch (error) {
        console.error("Error fetching connections:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }
};


// :::::::::::::::::::::: PUSH MATCH FOR A USER ::::::::::::::::::::::
const pushMatch = async (req, res) => {
    let { userId, match_userId } = req.body;
    const kolkataTime = new Date();


    if (!userId || !match_userId) {
        return res.status(500).json({ err: "User id required" });
    }


    // Check already matched;
    const check = await matchesModel.findOne({
        user_id: userId,
        "matches.match_user_id": match_userId
    });

    if (check) {
        return res.status(400).json({ err: "Already matched" });
    }


    try {

        await matchesModel.updateOne(
            { user_id: userId },
            {
                $addToSet: {
                    matches: {
                        match_user_id: match_userId,
                        match_date: kolkataTime,
                        interest_send: "pending",
                        status: "pending",
                        generate_by: 'admin'
                    }
                }
            },
            { upsert: true }
        );

        // ::::::::::::::::::::::: Send and Store Notification :::::::::::::::::;
        const FCMtoken = await getToken(userId);
        await sendNotification({
            tokens: FCMtoken,
            userId: userId,
            title: "You have a new match!",
            body: `You matched with 1 profile.`,
            type: "match"
        });

        return res.status(200).json({ message: "Match sent successfully" });


    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }
}


// :::::::::::::::: SEND NOTIFICATION FOR ALL USERS ::::::::::::::::
const notificationSend = async (req, res) => {
    const { title, body, userId } = req.body;

    try {
        // Send Notification;
        let allTokens;

        if (userId) {
            const getToken = await notifytokenModel.findOne({ user_id: userId });
            allTokens = getToken.fcmTokens;

        } else {
            const tokensDocs = await notifytokenModel.find({}, 'fcmTokens').lean();
            allTokens = tokensDocs.flatMap(doc => doc.fcmTokens);
        }


        await sendNotification({
            tokens: allTokens,
            userId: userId,
            title: title,
            body: body,
            type: "generic"
        });

        res.status(200).json({ message: "Successfully sent" })

    } catch (error) {
        res.status(500).json({ err: "Unable to send notification" })
    }

}


// :::::::::::::::::::::::::: FEEDBACK USER :::::::::::::::::::::::
const userFeedBack = async (req, res) => {
    const { userId, feedback } = req.body;

    if (!userId || !feedback) {
        return res.status(400).json({ err: 'Userid and feedback is required' });
    }

    try {
        const addFeedBack = await usersModel.updateOne({ _id: userId }, {
            $set: {
                admin_feedback: feedback
            }
        });

        if (addFeedBack.modifiedCount < 1) {
            return res.status(500).json({ err: "feedback add failed" })
        }

        return res.status(200).json({ message: "feedback add successfully" });


    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}



// :::::::::::::::::::::::::: CHANGE PROFILE STATUS (PAUSE OR OPEN)  :::::::::::::::::::::::
const changeStatus = async (req, res) => {
    const { userId, status } = req.body;

    if (!userId || !status) {
        return res.status(400).json({ err: 'Userid and status is required' });
    }

    try {
        const statusQuery = await usersModel.updateOne({ _id: userId }, {
            $set: {
                profile_status: status
            }
        });

        if (statusQuery.modifiedCount < 1) {
            return res.status(500).json({ err: "Profile status not change" })
        }

        return res.status(200).json({ message: status === "true" ? "Profile open successfully" : "Profile pause successfully" });


    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}

// :::::::::::::::::::::::::: CHANGE PROFILE TYPE (confidential OR OPEN)  :::::::::::::::::::::::
const changeProfileType = async (req, res) => {
    const { userId, type } = req.body;

    if (!userId || !type) {
        return res.status(400).json({ err: 'Userid and type is required' });
    }

    try {
        const statusQuery = await usersModel.updateOne({ _id: userId }, {
            $set: {
                profile_type: type
            }
        });

        if (statusQuery.modifiedCount < 1) {
            return res.status(500).json({ err: "Profile type not change" })
        }

        return res.status(200).json({ message: "Profile type change successfully" });


    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}


// ::::::::::::::::::::::::::::::: UPLOAD AGREEMENT :::::::::::::::::::::::::::
const uploadAgreement = async (req, res) => {
    const { file } = req.body; //base64

    if (!file) {
        return res.status(400).json({ err: "file is required" });
    }


    try {
        const buffer = Buffer.from(file, "base64");
        const pdfMagic = buffer.subarray(0, 4).toString();

        if (pdfMagic !== "%PDF") {
            return res.status(400).json({ err: "Only valid PDF files are allowed" });
        }

        const filepath = path.join(__dirname, "agreement", "agreement.pdf");

        fs.mkdirSync(path.dirname(filepath), { recursive: true });

        fs.writeFileSync(filepath, buffer);


        if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
            return res.status(200).json({ message: "File uploaded successfully" });
        } else {
            return res.status(500).json({ err: "File upload failed" });
        }

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }
};





module.exports = {
    matchCronSetup,
    notificationSend,
    allUserCount,
    changeSubscriptionStatus,
    deleteUser,
    getAllUser,
    getUserDetails,
    getMatches,
    getConnection,
    pushMatch,
    register,
    getMatchCron,
    userFeedBack,
    changeStatus,
    uploadAgreement,
    changeProfileType
}