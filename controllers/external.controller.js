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
            username: username,
            password: pass
        })


    } catch (error) {
        console.log(error)
        return res.status(500).json({ err: "Something went wrong" })
    }

}


// :::::::::: Match CRON Setup ::::::::::
const matchCronSetup = async (req, res) => {
    const kolkataNow = moment().tz('Asia/Kolkata').toDate();
    try {
        const { week_day, time } = req.body;

        if ([week_day, time].some((field) => !field || field == "")) {
            return res.status(400).json({ err: "Require all fields" });
        }

        const updateData = {
            time,
            week_day
        };

        const updatedDoc = await matchCronModel.findOneAndUpdate(
            {}, // empty filter since you want to update the only document
            updateData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Re-schedule after update
        matchCron();

        return res.status(200).json({ message: "Match cron setup updated successfully.", data: updatedDoc });

    } catch (error) {
        console.error("Error setting up match cron:", error);
        return res.status(500).json({ err: "Internal server error." });
    }

};


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
                subscription_end_date: endDate
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
    // Parse type, page, and limit from request body with default fallbacks
    const type = parseInt(req.body?.type) || 1; // 1 = all, 2 = subscribed, 3 = unsubscribed
    const page = parseInt(req.body?.page) || 1;
    const limit = parseInt(req.body?.limit) || 10;
    let search = req.body.searchQuery;

    const skip = (page - 1) * limit;

    try {
        let filter = {
            is_del: false,
            $or: [
                { whatsapp_number: { $regex: search, $options: 'i' } },
                { user_name: { $regex: search, $options: 'i' } },
                { full_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ],
        };

        if (type === 2) {
            filter.is_subscribed = true;
        } else if (type === 3) {
            filter.is_subscribed = false;
        } else if (type !== 1) {
            return res.status(400).json({ err: "Invalid type value." });
        }

        const [count, users] = await Promise.all([
            usersModel.countDocuments(filter),
            usersModel.find(filter).skip(skip).limit(limit)
        ]);

        return res.status(200).json({
            page,
            limit,
            totalUsers: count,
            totalPages: Math.ceil(count / limit),
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

    if(!userId){
        return res.status(500).json({err: "user id is required"});
    }

    try {

        const userDetails = await usersModel.findOne({ _id: userId, is_subscribed: true, is_del: false });
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

    const fromDateKolkata = moment(fromDate).tz('Asia/Kolkata').startOf('day').toDate();
    const toDateKolkata = moment(toDate).tz('Asia/Kolkata').endOf('day').toDate();

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
            m =>
                m.interest_send === "pending" &&
                (
                    (m.match_date && m.match_date >= fromDateKolkata && m.match_date <= toDateKolkata) ||
                    !m.match_date
                )
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

    const fromDateKolkata = moment(fromDate).tz('Asia/Kolkata').startOf('day').toDate();
    const toDateKolkata = moment(toDate).tz('Asia/Kolkata').endOf('day').toDate();

    try {
        const result = await connectionModel.aggregate([
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { user_1: mongoose.Types.ObjectId(userId) },
                                { user_2: mongoose.Types.ObjectId(userId) },
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
                            if: { $eq: ["$user_1", mongoose.Types.ObjectId(userId)] },
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


// :::::::::::: PUSH MATCH FOR A USER ::::::::::::
const pushMatch = async (req, res) => {
    let { userId, match_userId } = req.body;
    const kolkataTime = moment().tz("Asia/Kolkata").toDate();


    if (!userId || !match_userId) {
        return res.status(500).json({ err: "User id required" });
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
                        status: "pending"
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

        return res.status(200).json({ message: "Match push successfully" });


    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }
}


// :::::::::::::::: SEND NOTIFICATION FOR ALL USERS ::::::::::::::::
const notificationSend = async (req, res) => {
    const { title, body } = req.body;

    // Send Notification;
    const tokensDocs = await notifytokenModel.find({}, 'fcmTokens').lean();
    const allTokens = tokensDocs.flatMap(doc => doc.fcmTokens);

    await sendNotification({
        token: allTokens,
        title: title,
        body,
        userId: '',
        type: "generic"
    });

}





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
}