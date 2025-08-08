const router = require("express").Router();
const { sendInterest, getInterest } = require("../controllers/interest.controller");
const middleware = require("../middleware/middleware");


router
    .route("/send")
    .post(middleware, sendInterest);

router
    .route("/bookmark")
    .post(middleware, getInterest);

router
    .route("/get")
    .post(middleware, getInterest);


module.exports = router;
