const path = require('path');
const fs = require('fs').promises; // Use the promise-based API
const expressAsyncHandler = require('express-async-handler');

const saveFile = expressAsyncHandler(async (req, res, next) => {
    if (!req.files) return next();

    // Array to hold promises for writing files
    const writePromises = [];

    for (const fieldName in req.files) {
        const file = req.files[fieldName][0]; // Each field has one file
        const filename = `${Date.now()}-${file.originalname}`;
        const outputPath = path.join('public/uploads', filename);

        // Add the writeFile promise to the array
        writePromises.push(
            fs.writeFile(outputPath, file.buffer).then(() => {
                // Attach file name to request body once written
                req.body[fieldName] = filename;
            })
        );
    }

    // Wait for all files to be written
    await Promise.all(writePromises);

    next();
});

module.exports = saveFile;
