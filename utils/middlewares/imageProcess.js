const sharp = require('sharp');
const path = require('path');
const expressAsyncHandler = require('express-async-handler');

const resizeImage = expressAsyncHandler(async (req, res, next) => {
    if (!req.file) return next();
    const filename = `${Date.now()}-cover.png`;
    const outputPath = path.join('public/uploads', filename);

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('png')
        .png({ quality: 90 })
        .toFile(outputPath);

    req.body[req.file.fieldname] = filename; // Attach file name to request body
    next();
});

const resizeImages = expressAsyncHandler(async (req, res, next) => {
    if (!req.files || req.files.length === 0) return next();

    req.body.images = [];
    await Promise.all(
        req.files.map(async (file, i) => {
            const filename = `${Date.now()}-${i + 1}.png`;
            const outputPath = path.join('public/uploads', filename);

            await sharp(file.buffer)
                .resize(500, 500)
                .toFormat('png')
                .png({ quality: 90 })
                .toFile(outputPath);

            req.body.images.push(filename);
        })
    );

    next();
});

module.exports = { resizeImage, resizeImages };
