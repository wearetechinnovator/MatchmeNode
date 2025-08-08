const router = require("express").Router();
const { sendInterest, getInterest, sendConnection, getConnection } = require("../controllers/interest.controller");
const middleware = require("../middleware/middleware");


router
    .route("/accept")
    .post(middleware, sendConnection);

router
    .route("/reject")
    .post(middleware, sendConnection);

router
    .route("/remove")
    .post(middleware, sendConnection);

router
    .route("/get")
    .get(middleware, getConnection);


module.exports = router;