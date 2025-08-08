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


// :::::::::: Match CRON Setup ::::::::::
const matchCronSetup = async (req, res) => {
    const kolkataNow = moment().tz('Asia/Kolkata').toDate();
    try {
        const { week_day, time } = req.body;

        if ([week_day, time].some((field) => !field || field == "")) {
            return res.status(400).json({ message: "Require all fields" });
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
        return res.status(500).json({ message: "Internal server error." });
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
            return res.status(400).json({ message: "Invalid type value." });
        }

        return res.status(200).json({ count });

    } catch (error) {
        console.error("Error fetching user count:", error);
        return res.status(500).json({ message: "Internal server error." });
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

        return res.status(200).json({ success: true });

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

    const skip = (page - 1) * limit;

    try {
        let filter = { is_del: false };

        if (type === 2) {
            filter.is_subscribed = true;
        } else if (type === 3) {
            filter.is_subscribed = false;
        } else if (type !== 1) {
            return res.status(400).json({ message: "Invalid type value." });
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
        return res.status(500).json({ message: "Internal server error." });
    }
};



// ::::::::::: GET SINGLE USER ::::::::::::
const getUserDetails = async (req, res) => {
    const { userId } = req.body



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
        return res.status(500).json({ message: "Internal server error." });
    }
};


// ::::::::::: GET MATCHES OF A USER ::::::::::::
const getMatches = async (req, res) => {
    const { userId } = req.body;

    try {
        let query = await matchesModel.findOne({
            user_id: userId
        }).populate("matches.match_user_id");

        console.log(query);

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


// :::::::::::: GET Connection of user ::::::::::::
const getConnection = async (req, res) => {
    let { userId } = req.body;


    if (!userId) {
        return res.status(500).json({ err: "User id required" });
    }

    try {

        const result = await connectionModel.aggregate([
            {
                $match: {
                    $or: [
                        { user_1: userId },
                        { user_2: userId },
                    ],
                }
            },
            {
                $project: {
                    other_user_id: {
                        $cond: {
                            if: { $eq: ["$user_1", userId] },
                            then: "$user_2",
                            else: "$user_1"
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users", // Make sure this is the actual collection name (usually lowercase plural of model)
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


        if (!result || result.length < 1) {
            return res.status(500).json({ msg: "No Connection Available" });
        }


        return res.status(200).json(result);

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}


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

        return res.status(200).json({ message: "Match push successfully" });


    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }
}


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
    pushMatch
}