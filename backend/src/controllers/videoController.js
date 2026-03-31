const fs = require('fs');
const path = require('path');
const Video = require('../models/Video');
const { processVideo } = require('../services/videoProcessor');
const config = require('../config');

/**
 * Upload a new video
 */
const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided.' });
    }

    const { title, description, tags } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Video title is required.' });
    }

    const video = await Video.create({
      title,
      description: description || '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      uploadedBy: req.user._id,
      tenantId: req.user.tenantId,
      status: 'uploading',
    });

    // Respond immediately, then process in background
    res.status(201).json({
      message: 'Video uploaded successfully. Processing started.',
      video,
    });

    // Start background processing (don't await — fire and forget)
    const io = req.app.get('io');
    processVideo(video, io);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all videos for the current tenant
 */
const getVideos = async (req, res, next) => {
  try {
    const {
      status,
      sensitivityStatus,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    // Build filter — always scope to tenant
    const filter = { tenantId: req.user.tenantId };

    if (status) filter.status = status;
    if (sensitivityStatus) filter.sensitivityStatus = sensitivityStatus;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .populate('uploadedBy', 'username email')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Video.countDocuments(filter),
    ]);

    res.json({
      videos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single video by ID
 */
const getVideoById = async (req, res, next) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
    }).populate('uploadedBy', 'username email');

    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    res.json({ video });
  } catch (error) {
    next(error);
  }
};

/**
 * Stream video with HTTP range requests
 */
const streamVideo = async (req, res, next) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
    });

    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    const filePath = path.join(config.uploadDir, video.filename);

    // Check file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Video file not found on server.' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const stream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': video.mimetype,
      });

      stream.pipe(res);
    } else {
      // No range — send entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': video.mimetype,
      });

      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a video
 */
const deleteVideo = async (req, res, next) => {
  try {
    const filter = {
      _id: req.params.id,
      tenantId: req.user.tenantId,
    };

    // Only allow deletion by uploader or admin
    if (req.user.role !== 'admin') {
      filter.uploadedBy = req.user._id;
    }

    const video = await Video.findOneAndDelete(filter);

    if (!video) {
      return res.status(404).json({ message: 'Video not found or access denied.' });
    }

    // Remove file from disk
    const filePath = path.join(config.uploadDir, video.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Video deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadVideo,
  getVideos,
  getVideoById,
  streamVideo,
  deleteVideo,
};
