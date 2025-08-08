const router = require("express").Router();
const { matchCronSetup,allUserCount, changeSubscriptionStatus,
    deleteUser, getAllUser, getUserDetails,
    getMatches, getConnection, pushMatch,
    notificationSend, register } = require("../controllers/external.controller");
const middleware = require("../middleware/middleware");



router
    .route("/register-user")
    .post(register);

router
    .route("/match-cron-setup")
    .post(matchCronSetup);

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
    .route("/send-notification")
    .post(notificationSend);


module.exports = router;