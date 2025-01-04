const multer = require('multer');
const path = require('path');

 
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/')); 
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);  
  }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      const allowedFields = ['profileImage', 'aadharImage'];
      if (!allowedFields.includes(file.fieldname)) {
        return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE'));
      }
      cb(null, true);
    }
  });
  
module.exports = upload;
