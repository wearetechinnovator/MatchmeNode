require("dotenv").config();
const express = require("express");
const router = require("./routes/index.route");
const connection = require("./db/connection");
const sendNotification = require("./services/sendNotification");
const checkSubscription = require("./services/subscriptionCron");
const { matchCron } = require("./services/matchCron");
const PORT = 8080 || process.env.PORT
const cors = require("cors");
const morgan = require('morgan');
const accessLogStream = require('./services/loger');
const app = express();



app.use(cors()); //Allow all origin;
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(express.static("uploads")); // Serve static files from the uploads directory

// LOG
app.use(morgan('combined', { stream: accessLogStream }));

// API routes
app.use("/api/v1", router);

// FOR testing....
app.get("/", (req, res) => {
    res.send({ test: "Run...." })
})




// Run CRON Jobs
checkSubscription.start();
matchCron();




// DB connection..
connection().then(con => {
    if (con) {
        app.listen(PORT, () => {
            console.log("[*] Server running on " + PORT);
        })
    } else {
        console.log("[*] Database connection failed")
    }
}).catch((er) => {
    console.log("[*] Something went wrong: ", er)
})
