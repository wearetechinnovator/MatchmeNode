const router = require("express").Router();
const {changeReadStatus, addChat, getChat } = require("../controllers/adminChat.controller");
const middleware = require("../middleware/middleware");


router
    .route("/change-read-status")
    .post(changeReadStatus)


router
    .route("/add-chat")
    .post(addChat)


router
    .route("/get-chat")
    .post(getChat)



    
module.exports = router;
