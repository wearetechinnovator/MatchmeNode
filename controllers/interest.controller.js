const matchModel = require("../models/matches.model");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const connectionModel = require("../models/connection.model");
const sendNotification = require("../services/sendNotification");
const { getToken } = require("./notification.controller");
const usersModel = require("../models/users.model");



// :::::::::::: interested Send ::::::::::::
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
        if (type === 0) {
            await matchModel.updateOne(
                { user_id: new mongoose.Types.ObjectId(userData._id) },
                [
                    {
                        $set: {
                            matches: {
                                $concatArrays: [
                                    {
                                        $filter: {
                                            input: "$matches",
                                            as: "m",
                                            cond: {
                                                $eq: ["$$m.match_user_id", new mongoose.Types.ObjectId(matchUserId)]
                                            }
                                        }
                                    },
                                    {
                                        $filter: {
                                            input: "$matches",
                                            as: "m",
                                            cond: {
                                                $ne: ["$$m.match_user_id", new mongoose.Types.ObjectId(matchUserId)]
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                ]
            );

            return res.status(200);
        }

        const result = await matchModel.updateOne(
            { user_id: userData._id },
            {
                $set: {
                    "matches.$[elem].interest_send": intesetOption[type],
                    "matches.$[elem].interest_send_date": kolkataTime
                }
            },
            {
                arrayFilters: [
                    { "elem.match_user_id": new mongoose.Types.ObjectId(matchUserId) }
                ]
            }
        );

        if (result.modifiedCount < 1) {
            return res.status(500).json({ err: "Interest not send" });
        }

        // Get matchuser info
        const matchUser = await usersModel.findOne({ _id: matchUserId });


        // ::::::::::::::::::::::: Send and Store Notification :::::::::::::::::;
        // Only for `send` interest notification send;
        if (type === 1) {
            const FCMtoken = await getToken(matchUserId);
            await sendNotification({
                tokens: FCMtoken,
                userId: matchUserId,
                title: "You’ve received a new interest.",
                body: `Someone has shown interest in you`,
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


// :::::::::::: Connection ::::::::::::
const sendConnection = async (req, res) => {
    const { connectionUserId, type } = req.body;
    const userData = req.userData;
    const kolkataTime = new Date();
    const intesetOption = {
        0: "rejected",
        1: "accepted",
        2: "removed"
    };


    try {

        const result = await matchModel.updateOne(
            {
                user_id: new mongoose.Types.ObjectId(connectionUserId),
                "matches.match_user_id": new mongoose.Types.ObjectId(userData._id)
            },
            {
                $set: {
                    "matches.$[elem].status": intesetOption[type],
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
        await sendNotification({
            tokens: FCMtoken,
            userId: connectionUserId,
            title: "You’ve made a new connection.",
            body: `Someone is now connected with you.`,
            type: "connection"
        });


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
