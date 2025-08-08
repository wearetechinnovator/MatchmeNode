const userModel = require("../models/users.model");
const jwt = require("jsonwebtoken");
const jwtKey = process.env.JWT_KEY;


const middleware = async (req, res, next) => {
    let token;

    if (req.method === 'POST') {
        token = req.body.token;
    } else {
        token = req.headers['authorization']?.split(" ")[1]
    }
    

    if (!token) {
        return res.status(401).json({ error: "Token is missing" });
    }

    try {
        const decoded = jwt.verify(token, jwtKey);
        const user = await userModel.findOne({ _id: decoded.id });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        req.userData = user;
        next();

    } catch (error) {
        console.error("JWT verification failed:", error);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

module.exports = middleware;
