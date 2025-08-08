const router = require("express").Router();
const { add, get } = require("../controllers/match.controller");
const middleware = require("../middleware/middleware");


router
    .route("/add")
    .post(add);


router
    .route("/get")
    .get(middleware, get);

module.exports = router;