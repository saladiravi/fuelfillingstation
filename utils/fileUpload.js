const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath); 
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});


const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedFields = ['aadhar_Image', 'profile_image','aadhar_backsideimage']; 
    if (!allowedFields.includes(file.fieldname)) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE'));
    }
    cb(null, true);
  }
});

module.exports = upload;
