const adminChatModel = require("../models/adminChat.model");
const usersModel = require("../models/users.model");
const sendNotification = require("../services/sendNotification");
const { getToken } = require("./notification.controller");
const jwt = require("jsonwebtoken");
const jwtKey = process.env.JWT_KEY;


// :::::::::::::::::::::::::::: GET CHAT LISTS ::::::::::::::::::::::::::::
const getList = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            searchQuery = ""
        } = req.body;

        const parsedPage = Math.max(1, parseInt(page));
        const parsedLimit = Math.max(1, parseInt(limit));
        const skip = (parsedPage - 1) * parsedLimit;

        // -------------------
        // 1. Build user filter only for search
        // -------------------
        let userFilter = { is_del: false };

        if (searchQuery && searchQuery.trim() !== "") {
            userFilter.$or = [
                { whatsapp_number: { $regex: searchQuery, $options: "i" } },
                { user_name: { $regex: searchQuery, $options: "i" } },
                { full_name: { $regex: searchQuery, $options: "i" } },
                { email: { $regex: searchQuery, $options: "i" } }
            ];
        }

        // -------------------
        // 2. Find users matching search
        // -------------------
        const filteredUsers = await usersModel.find(userFilter).select("_id");
        const userIds = filteredUsers.map(u => u._id);

        // 3. Chat filter based on userIds
        let chatFilter = {};
        if (userIds.length > 0) {
            chatFilter.user_id = { $in: userIds };
        } else if (searchQuery && searchQuery.trim() !== "") {
            // No users match search → return empty
            chatFilter.user_id = { $in: [] };
        }

        // -------------------
        // 4. Fetch total count + paginated chats
        // -------------------
        const [count, chats] = await Promise.all([
            adminChatModel.countDocuments(chatFilter),
            adminChatModel.find(chatFilter)
                .populate("user_id")
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(parsedLimit)
        ]);

        // -------------------
        // 5. Format result
        // -------------------
        const list = chats.map(chat => {
            const lastMessage = chat.message.length > 0 ? chat.message[chat.message.length - 1] : null;
            return {
                user: chat.user_id,
                lastMessage,
                updatedAt: chat.updatedAt
            };
        });

        return res.status(200).json({
            page: parsedPage,
            limit: parsedLimit,
            totalChats: count,
            totalPages: Math.ceil(count / parsedLimit),
            list
        });

    } catch (error) {
        console.error("Error fetching chat list:", error);
        return res.status(500).json({ err: "Internal server error." });
    }
};


// ::::::::::::::::::::::::::::: CHANGE READ STATUS ::::::::::::::::::::::::
const changeReadStatus = async (req, res) => {
    let { userId, type, token } = req.body;

    if (token) {
        const decoded = jwt.verify(token, jwtKey);
        const user = await usersModel.findOne({ _id: decoded.id });
        userId = user._id
    }

    if (!userId || !type) {
        return res.status(500).json({ err: "Message id and type required" });
    }

    if (!['admin', 'user'].includes(type)) {
        return res.status(400).json({ err: "You are not a valid person" });
    }


    try {
        const result = await adminChatModel.updateOne(
            { user_id: userId, "message.message_by": type },
            { $set: { "message.$[elem].readStatus": true } },
            { arrayFilters: [{ "elem.message_by": type }] }
        );


        if (result.modifiedCount === 0) {
            return res.status(404).json({ err: "No messages updated" });
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ err: "Something went wrong" });
    }
};


// ::::::::::::::: ADD CHAT ::::::::::::::::: 
const addChat = async (req, res) => {
    let { msg, userId, msgBy, token } = req.body;

    if (token) {
        const decoded = jwt.verify(token, jwtKey);
        const user = await usersModel.findOne({ _id: decoded.id });
        userId = user._id
    }

    if (!userId) {
        return res.status(400).json({ err: "Message id required" });
    }


    if (!msg || !msgBy) {
        return res.status(400).json({ err: "Message and sender are required" });
    }

    if (!['admin', 'user'].includes(msgBy)) {
        return res.status(400).json({ err: "You are not a valid person" });
    }

    try {
        const updatedChat = await adminChatModel.findOneAndUpdate(
            { user_id: userId },
            {
                $push: {
                    message: {
                        message: msg,
                        message_by: msgBy
                    }
                }
            },
            {
                new: true,        // return updated doc
                upsert: true,     // insert new doc if not found
                setDefaultsOnInsert: true // if schema has defaults
            }
        );

        if (msgBy === "admin") {
            const FCMtoken = await getToken(userId);
            await sendNotification({
                tokens: FCMtoken,
                userId: userId,
                title: "Message from admin",
                body: msg,
                type: "message"
            });
        }


        return res.status(200).json(updatedChat.message);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ err: "Something went wrong" });
    }
};


// :::::::::::::::::::: GET CHAT :::::::::::::::::::::::: 
const getChat = async (req, res) => {
    let { userId, token } = req.body;

    if (token) {
        const decoded = jwt.verify(token, jwtKey);
        const user = await usersModel.findOne({ _id: decoded.id });
        userId = user._id
    }


    if (!userId) {
        return res.status(400).json({ err: "Message id required" });
    }

    try {
        const chat = await adminChatModel.findOne({ user_id: userId });

        if (!chat) {
            return res.status(404).json({ err: "Chat not found" });
        }

        return res.status(200).json(chat.message);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ err: "Something went wrong" });
    }

};




module.exports = {
    changeReadStatus,
    addChat,
    getChat,
    getList
}