import multer from 'multer';
import sharp from 'sharp';
import AppError from './appError.js';
import catchAsync from './catchAsync.js';

/**
 * @breif Multer memory storage
 */
const multerStorage = multer.memoryStorage();

/**
 * @breif Method to check if file uploaded is an image
 * @param {Request} req -> Request object
 * @param {File} file -> File field
 * @param {Callback} cb -> Callback function
 */
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};
// Maximum size of user uploaded file(photo) 1MB
const maxImageSize = 1 * 1000 * 1000;

/**
 * @brief multer utility to upload image
 */
const upload = multer({
  storage: multerStorage,
  limits: { fileSize: maxImageSize },
  fileFilter: multerFilter,
});

export const uploadPhoto = upload.single('photo');

/**
 * @breif Method to resize photo, convert image to "jpeg and increase quality"
 * @param {String} type -> Type for the resize, either for user or customer
 */
export const resizePhoto = (type) =>
  catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    // Stored user image name string type-id-currentDate.jpeg
    req.file.filename = `${type}-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/images/${type}/${req.file.filename}`);

    next();
  });
