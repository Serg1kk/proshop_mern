import path from 'path'
import express from 'express'
import multer from 'multer'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png']
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png']
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/')
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${file.fieldname}-${Date.now()}${ext}`)
  },
})

function checkFileType(file, cb) {
  const ext = path.extname(file.originalname).toLowerCase()
  const extOk = ALLOWED_EXTENSIONS.includes(ext)
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype)

  if (extOk && mimeOk) {
    return cb(null, true)
  }
  cb(new Error('Images only (jpg, jpeg, png)'))
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => checkFileType(file, cb),
})

router.post('/', protect, admin, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      res.status(400)
      return next(err)
    }
    if (!req.file) {
      res.status(400)
      return next(new Error('No image uploaded'))
    }
    res.send(`/${req.file.path}`)
  })
})

export default router
