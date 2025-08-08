const router = require("express").Router();
const middleware = require("../middleware/middleware");
const {add, get} = require("../controllers/psychometric.controller");



router
    .route("/add")
    .post(middleware, add);


router
    .route("/get")
    .get(middleware, get);


module.exports = router;