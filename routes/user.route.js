const { register, update, login, get, upload, viewPhoto, changeSubscriptionStatus } = require("../controllers/user.controller");
const middleware = require("../middleware/middleware");
const router = require("express").Router();
const imageMiddleware = require("../helper/imageUpload");



router
    .route("/register")
    .post(register);


router
    .route("/login")
    .post(login);


router
    .route("/update")
    .post(middleware, update);


router
    .route("/get")
    .post(middleware, get);


router
    .route("/upload")
    .post(imageMiddleware, middleware,  upload);


router
    .route("/upload/:filename")
    .get(viewPhoto);



module.exports = router;
