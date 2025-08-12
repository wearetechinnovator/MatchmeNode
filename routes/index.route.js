const router = require('express').Router();
const userRoute = require("./user.route");
const preferanceRoute = require("./preferance.route");
const psychometricRoute = require("./psychometric.route");
const matchRoute = require("./match.route");
const interestRoute = require("./interest.route");
const connetionRoute = require("./connection.route");
const notificationRoute = require("./notification.route");
const externalRoute = require("./external.route");
const adminChatRoute = require("./adminChat.route");




router.use("/users", userRoute);
router.use("/preferance", preferanceRoute);
router.use("/psychometric", psychometricRoute);
router.use("/match", matchRoute);
router.use("/interest", interestRoute);
router.use("/connection", connetionRoute);
router.use("/notification", notificationRoute);
router.use("/admin", externalRoute);
router.use("/admin-chat", adminChatRoute);



module.exports = router;
