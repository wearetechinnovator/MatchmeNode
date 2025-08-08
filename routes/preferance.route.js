const { add, get, remove } = require("../controllers/preferance.controller");
const router = require("express").Router();
const middleware = require("../middleware/middleware");


router
    .route("/add")
    .post(middleware, add);

router
    .route("/get")
    .post(middleware, get)

router
    .route("/delete")
    .delete(middleware, remove)


module.exports = router;