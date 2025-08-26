const router = require("express").Router();
const { getChat, addChat, changeReadStatus, get, getList } = require("../controllers/adminChat.controller");
const {
    matchCronSetup, allUserCount, changeSubscriptionStatus,
    deleteUser, getAllUser, getUserDetails,
    getMatches, getConnection, pushMatch,
    notificationSend, register,
    getMatchCron,
    userFeedBack,
    changeStatus,
    uploadAgreement,
    changeProfileType
} = require("../controllers/external.controller");



router
    .route("/register-user")
    .post(register);

router
    .route("/match-cron-setup")
    .post(matchCronSetup);

router
    .route("/match-cron-get")
    .get(getMatchCron);


router
    .route("/user-count")
    .post(allUserCount);

router
    .route("/subscription-status-change")
    .post(changeSubscriptionStatus);

router
    .route("/delete-user")
    .post(deleteUser);

router
    .route("/get-all-user")
    .post(getAllUser);

router
    .route("/get-user-details")
    .post(getUserDetails);

router
    .route("/get-matches")
    .post(getMatches);

router
    .route("/get-connection")
    .post(getConnection);

router
    .route("/push-match")
    .post(pushMatch);

router
    .route("/notify")
    .post(notificationSend);


router
    .route("/get-all-tickets")
    .post(get);

router
    .route("/get-single-chats")
    .post(getChat);

router
    .route("/add-chats")
    .post(addChat);


router
    .route("/chat-lists")
    .get(getList)

router
    .route("/change-read-status")
    .post(changeReadStatus);

router
    .route("/add-feedbacks")
    .post(userFeedBack);

router
    .route("/change-status")
    .post(changeStatus);

router
    .route("/change-type")
    .post(changeProfileType);


router
    .route("/upload-agreement")
    .post(uploadAgreement);    


module.exports = router;