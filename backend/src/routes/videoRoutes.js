const express = require('express');
const router = express.Router();
const {
  uploadVideo,
  getVideos,
  getVideoById,
  streamVideo,
  deleteVideo,
} = require('../controllers/videoController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

// POST /api/videos/upload — Editor & Admin only
router.post(
  '/upload',
  authorize('editor', 'admin'),
  upload.single('video'),
  uploadVideo
);

// GET /api/videos — list videos (all roles)
router.get('/', getVideos);

// GET /api/videos/:id — get single video
router.get('/:id', getVideoById);

// GET /api/videos/:id/stream — stream video
router.get('/:id/stream', streamVideo);

// DELETE /api/videos/:id — Editor (own) & Admin
router.delete('/:id', authorize('editor', 'admin'), deleteVideo);

module.exports = router;
