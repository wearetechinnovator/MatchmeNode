const adminChatModel = require("../models/adminChat.model");


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

// :::::::::::::::::::::::::::: GET CHAT LIST ::::::::::::::::::::::::::::
const getList = async (req, res) => {
    try {
        const chats = await adminChatModel
            .find()
            .populate("user_id")
            .sort({ _id: -1 });

        const list = chats.map(chat => {
            const lastMessage = chat.message.length > 0 ? chat.message[chat.message.length - 1] : null;
            return {
                user: chat.user_id,
                lastMessage
            };
        });

        return res.status(200).json({list});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ err: "Something went wrong" });
    }
};


// ::::::::::::::::::::::::::::: CHANGE READ STATUS ::::::::::::::::::::::::
const changeReadStatus = async (req, res) => {
    const { messageId, type } = req.body;

    if (!messageId || !type) {
        return res.status(500).json({ err: "Message id and type required" });
    }

    if (!['admin', 'user'].includes(type)) {
        return res.status(400).json({ err: "You are not a valid person" });
    }


    try {
        const result = await adminChatModel.updateOne(
            { _id: messageId, "message.message_by": type },
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
    const { msg, msgId, msgBy } = req.body;


    if (!msg || !msgBy) {
        return res.status(500).json({ err: "type and message required" });
    }

    if (!['admin', 'user'].includes(msgBy)) {
        return res.status(400).json({ err: "You are not a valid person" });
    }

    try {

        const updatedChat = await adminChatModel.findByIdAndUpdate(
            msgId,
            {
                $push: {
                    message: {
                        message: msg,
                        message_by: msgBy
                    }
                }
            },
            { new: true } // return updated document
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
    const { msgId } = req.body;


    if (!msgId) {
        return res.status(400).json({ err: "Message id required" });
    }

    try {
        const chat = await adminChatModel.findById(msgId);

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