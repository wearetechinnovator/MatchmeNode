const fs = require("fs");
const path = require("path");


// Setup the logger
const accessLogStream = fs.createWriteStream(
    path.join(__dirname, "..", 'access.log'),
    { flags: 'a' } // 'a' means append, 'w' means overwrite
);

module.exports = accessLogStream;
