const router = require("express").Router();
const { add, get, changeReadStatus, addChat, getChat } = require("../controllers/adminChat.controller");
const middleware = require("../middleware/middleware");


router
    .route("/add")
    .post(middleware, add)


router
    .route("/get")
    .get(middleware, get)


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
