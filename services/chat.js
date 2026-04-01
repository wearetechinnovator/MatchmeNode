const USER_LIST = {}

const socket = (io) => {
    io.on("connection", (socket) => {
        socket.on("iamin", (userId) => {
            USER_LIST[userId] = socket.id;
        })


        // {from : uid/'admin', to: uid, msg: "messsage"};
        socket.on("message", (data) => {
            const msgData = JSON.parse(data);
            const socketId = USER_LIST[msgData.to];

            if (!socketId) {
                io.to(USER_LIST[msgData.from]).emit("offline", "User currently unavailable");
            }

            io.to(socketId).emit('admin-message', data);
        })


        socket.on("disconnect", () => {
            console.log("Client disconnected", socket.id);

            for (const [userId, id] of Object.entries(USER_LIST)) {
                console.log(userId, id);
                if (id === socket.id) {
                    delete USER_LIST[userId];
                    console.log(`Removed ${userId} from USER_LIST`);
                    break;
                }
            }
        });
    })

}


module.exports = socket;
