const router = require("express").Router();
const { add, addToken, get } = require("../controllers/notification.controller");
const middleware = require("../middleware/middleware");


router
    .route("/add-token")
    .post(middleware, addToken);


router
    .route("/add")
    .post(middleware, add);

router
    .route("/get")
    .get(middleware, get);


module.exports = router;