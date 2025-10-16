const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');


// Set storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

// Initialize upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
            return cb(new Error('Only images are allowed'));
        }
        cb(null, true);
    }
}).fields([
    { name: 'one', maxCount: 1 },
    { name: 'two', maxCount: 1 },
    { name: 'three', maxCount: 1 },
    { name: 'four', maxCount: 1 },
    { name: 'five', maxCount: 1 },
    { name: 'six', maxCount: 1 }
]);

// Middleware to handle image upload
const imageUpload = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ err: err.message });
        }

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ err: 'No files uploaded' });
        }

        // Store file paths
        const fields = ['one', 'two', 'three', "four", "five", "six"];
        req.filePaths = {};

        fields.forEach(field => {
            if (req.files[field]?.[0]) {
                req.filePaths[field] = req.files[field][0].path.split('uploads\\')[1]; // Store relative path
            }
        });
        
        console.log('000000000000000000000');
        console.log(req.filePaths)


        next();
    });
};


module.exports = imageUpload;
