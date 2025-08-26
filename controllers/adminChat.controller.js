const adminChatModel = require("../models/adminChat.model");
const usersModel = require("../models/users.model");


// ::::::::::::::: ADD MESSAGE TICKETS ::::::::::::::::: 
const add = async (req, res) => {
    const { msg, type } = req.body;
    const userData = req.userData;


    if (!msg || !type) {
        return res.status(500).json({ err: "type and message required" });
    }

    try {
        const insert = await adminChatModel.create({
            user_id: userData._id,
            Qtype: type,
            message: [{ message: msg, message_by: "user" }]
        })

        if (!insert) {
            return res.status(500).json({ err: "Failed to insert message" });
        }

        return res.status(200).json({
            _id: insert._id,
            user_id: insert.user_id,
            Qtype: insert.Qtype,
            lastMessage: insert.message[insert.message.length - 1]
        });


    } catch (error) {
        console.log(error)
        return res.status(500).json({ err: "Something went wrong" })
    }

}

// ::::::::::::::: GET ALL SUPPORT TICKETS WITH LAST MESSAGE ::::::::::::::::: 
const get = async (req, res) => {
    const userId = req.body?.userId || undefined;
    const userData = req.userData;

    try {
        let allChat

        // Admin only
        if (!userData && !userId) {
            allChat = await adminChatModel.find().populate("user_id").sort({ _id: -1 });
        }
        else {
            if (userData) {
                allChat = await adminChatModel.find({ user_id: userData._id }).populate("user_id").sort({ _id: -1 });
            } else if (userId) {
                allChat = await adminChatModel.find({ user_id: userId }).populate("user_id").sort({ _id: -1 });
            }
        }

        if (!allChat || allChat.length < 0) {
            return res.status(400).json({ err: "No chat available" });
        }

        allChat = allChat.map(chat => {
            return {
                _id: chat._id,
                user_id: chat.user_id._id,
                user_details: chat.user_id,
                Qtype: chat.Qtype,
                lastMessage: chat.message[chat.message.length - 1]
            };
        });


        return res.status(200).json(allChat);


    } catch (error) {
        console.log(error)
        return res.status(500).json({ err: "Something went wrong" });
    }

}

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
    const { userId, type } = req.body;

    if (!userId || !type) {
        return res.status(500).json({ err: "Message id and type required" });
    }

    if (!['admin', 'user'].includes(type)) {
        return res.status(400).json({ err: "You are not a valid person" });
    }


    try {
        const result = await adminChatModel.updateOne(
            { _id: userId, "message.message_by": type },
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
    const { msg, userId, msgBy } = req.body;


    if (!msg || !msgBy) {
        return res.status(500).json({ err: "type and message required" });
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
            { new: true } // ✅ this now works
        );

        if (!updatedChat) {
            return res.status(404).json({ err: "Chat not found" });
        }

        return res.status(200).json(updatedChat.message);


    } catch (error) {
        console.log(error)
        return res.status(500).json({ err: "Something went wrong" })
    }

}


// ::::::::::::::: GET CHAT ::::::::::::::::: 
const getChat = async (req, res) => {
    const { userId } = req.body;


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
    add, get,
    changeReadStatus,
    addChat,
    getChat,
    getList
}