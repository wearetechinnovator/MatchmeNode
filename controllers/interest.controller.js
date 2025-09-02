const matchModel = require("../models/matches.model");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const connectionModel = require("../models/connection.model");
const sendNotification = require("../services/sendNotification");
const { getToken } = require("./notification.controller");
const usersModel = require("../models/users.model");



// :::::::::::: interested `SEND` | `PENDING` | `REMOVED` ::::::::::::
const sendInterest = async (req, res) => {
    const { matchUserId, type } = req.body;
    const userData = req.userData;
    const kolkataTime = new Date();
    const intesetOption = {
        0: "pending",
        1: "send",
        2: "removed"
    };


    try {
        // Get user info
        const userInfo = await usersModel.findOne({ _id: userData._id });

        if (type === 0) {
            await matchModel.updateOne(
                { user_id: new mongoose.Types.ObjectId(userData._id) },
                [
                    {
                        $set: {
                            matches: {
                                $concatArrays: [
                                    {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: "$matches",
                                                    as: "m",
                                                    cond: {
                                                        $eq: [
                                                            "$$m.match_user_id",
                                                            new mongoose.Types.ObjectId(matchUserId)
                                                        ]
                                                    }
                                                }
                                            },
                                            as: "m",
                                            in: {
                                                $mergeObjects: [
                                                    "$$m",
                                                    {
                                                        interest_send: "pending",
                                                        interest_send_date: kolkataTime,
                                                        uset_act: true
                                                    }
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $filter: {
                                            input: "$matches",
                                            as: "m",
                                            cond: {
                                                $ne: [
                                                    "$$m.match_user_id",
                                                    new mongoose.Types.ObjectId(matchUserId)
                                                ]
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                ]
            );

            // Send and Store Notification 
            const FCMtoken = await getToken(matchUserId);
            await sendNotification({
                tokens: FCMtoken,
                userId: matchUserId,
                title: "Interest Pending",
                body: `Your interest in ${userInfo.full_name} is awaiting a response.`,
                type: "interest"
            });

            return res.status(200).json({ msg: "Interest set to pending" });
        }

        const result = await matchModel.updateOne(
            { user_id: userData._id },
            {
                $set: {
                    "matches.$[elem].interest_send": intesetOption[type],
                    "matches.$[elem].interest_send_date": kolkataTime,
                    "matches.$[elem].uset_act": true,
                }
            },
            {
                arrayFilters: [
                    { "elem.match_user_id": new mongoose.Types.ObjectId(matchUserId) }
                ]
            }
        );

        const countUnactedMatch = await matchModel.countDocuments({
            user_id: userData._id,
            "matches.user_act": false
        });

        if (countUnactedMatch === 0) {
            usersModel.updateOne({ _id: user._id }, { $set: { get_new_match: true } });
        }


        if (result.modifiedCount < 1) {
            return res.status(500).json({ err: "Interest not send" });
        }




        // ::::::::::::::::::::::: Send and Store Notification :::::::::::::::::;
        if (type === 1) {
            const FCMtoken = await getToken(matchUserId);
            await sendNotification({
                tokens: FCMtoken,
                userId: matchUserId,
                title: "New Interest Received",
                body: `${userInfo.full_name} has expressed interest in you.`,
                type: "interest"
            });

        } else {
            const FCMtoken = await getToken(matchUserId);
            await sendNotification({
                tokens: FCMtoken,
                userId: matchUserId,
                title: "Interest Withdrawn",
                body: `${userInfo.full_name} has withdrawn their interest in your profile.`,
                type: "interest"
            });
        }

        return res.status(200).json({ msg: "Interest send successfully" });


    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}


// :::::::::::::::: Get interested ::::::::::::::::
const getInterest = async (req, res) => {
    const userData = req.userData;
    const { type } = req.body; // 1 for sending data | 2 for receive data;

    try {
        let result;

        // interest send data;
        if (type === 1) {
            result = await matchModel.findOne({
                user_id: userData._id,
                matches: { $elemMatch: { interest_send: "send" } }
            }).populate("matches.match_user_id");


            const filterData = result?.matches.filter((q, _) => q.interest_send === "send" && q.status === "pending");
            result['matches'] = filterData;
        }

        // interest receive data;
        else if (type === 2) {
            result = await matchModel.aggregate([
                { $unwind: "$matches" },
                {
                    $match: {
                        "matches.match_user_id": userData._id,
                        "matches.interest_send": "send",
                        "matches.status": "pending",
                    }
                },
                {
                    $lookup: {
                        from: "users", // name of your user collection (adjust if it's different)
                        localField: "user_id",
                        foreignField: "_id",
                        as: "sender_user"
                    }
                },
                {
                    $unwind: "$sender_user" // optional, if you want flat object instead of array
                },
                {
                    $project: {
                        _id: 0,
                        sender_user_id: "$user_id",
                        sent_date: "$matches.interest_send_date",
                        sender_user: 1
                    }
                }
            ]);
        }


        if (!result) {
            return res.status(500).json({ err: "No interest found" });
        }


        return res.status(200).json(result);


    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}


// ::::::::::::::::::: Connection ::::::::::::::::::::::
const sendConnection = async (req, res) => {
    const { connectionUserId, type } = req.body;
    const userData = req.userData;
    const kolkataTime = new Date();
    const connectionOption = {
        0: "rejected",
        1: "accepted",
        2: "removed",
    };


    try {
        const userInfo = await usersModel.findOne({ _id: userData._id });

        const result = await matchModel.updateOne(
            {
                user_id: new mongoose.Types.ObjectId(connectionUserId),
                "matches.match_user_id": new mongoose.Types.ObjectId(userData._id)
            },
            {
                $set: {
                    "matches.$[elem].status": connectionOption[type],
                    "matches.$[elem].status_change_date": kolkataTime
                }
            },
            {
                arrayFilters: [
                    {
                        "elem.match_user_id": new mongoose.Types.ObjectId(userData._id)
                    }
                ]
            }
        );


        if (result.modifiedCount < 1) {
            return res.status(500).json({ err: "Connection not set" });
        }

        await connectionModel.create({
            user_1: connectionUserId,
            user_2: userData._id,
            date: kolkataTime
        });

        // ::::::::::::::::::::::: Send and Store Notification :::::::::::::::::;

        const FCMtoken = await getToken(connectionUserId);
        if (type === 0) {
            await sendNotification({
                tokens: FCMtoken,
                userId: connectionUserId,
                title: "Connection Declined",
                body: `${userInfo.full_name} has declined your connection request.`,
                type: "connection"
            });
        }
        else if (type === 1) {
            await sendNotification({
                tokens: FCMtoken,
                userId: connectionUserId,
                title: "You’ve made a new connection.",
                body: `${userInfo.full_name} is now connected with you.`,
                type: "connection"
            });
        }
        // else if (type === 2) {
        //     await sendNotification({
        //         tokens: FCMtoken,
        //         userId: connectionUserId,
        //         title: "Connection Pending",
        //         body: `Your connection in ${userInfo.full_name} is awaiting a response.`,
        //         type: "connection"
        //     });
        // }



        return res.status(200).json({ msg: "Connection set successfully" });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}


// :::::::::::: Connection ::::::::::::
const getConnection = async (req, res) => {
    const userData = req.userData;

    try {

        const userId = new mongoose.Types.ObjectId(userData._id);

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


        if (!result) {
            return res.status(500).json({ msg: "No Connection Available" });
        }


        return res.status(200).json(result);

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ err: "Something went wrong" });
    }

}




module.exports = {
    sendInterest,
    getInterest,
    sendConnection,
    getConnection
}
