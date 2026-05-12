import express from 'express'
const router = express.Router()
import { getFeatureFlags } from '../controllers/featureFlagController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

router.route('/').get(protect, admin, getFeatureFlags)

export default router
