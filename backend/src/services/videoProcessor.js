const Video = require('../models/Video');
const { analyzeVideo } = require('./sensitivityService');
const { optimizeVideo } = require('./videoOptimizer');

/**
 * Processes a video: optimizes streaming format, runs sensitivity analysis,
 * and emits real-time Socket.io updates.
 *
 * @param {Object} video - Mongoose Video document
 * @param {Object} io - Socket.io server instance
 */
const processVideo = async (video, io) => {
  try {
    // 1. Update status to processing
    await Video.findByIdAndUpdate(video._id, {
      status: 'processing',
      processingProgress: 0,
    });

    // Notify client that processing has started
    io.to(video.tenantId).emit('video:processing_started', {
      videoId: video._id,
      title: video.title,
    });

    // 2. FFmpeg Optimization (0% to 50% progress)
    io.to(video.tenantId).emit('video:processing_progress', {
      videoId: video._id,
      progress: 5,
      message: 'Preparing optimization pipeline...',
    });

    const optimizedData = await optimizeVideo(video, (percent) => {
      io.to(video.tenantId).emit('video:processing_progress', {
        videoId: video._id,
        progress: Math.floor(percent / 2), // Map 0-100 to 0-50
        message: `Optimizing video format: ${percent}%`,
      });
    });

    // Update DB with the new filename and size after optimization
    const optimizedVideo = await Video.findByIdAndUpdate(
      video._id,
      {
        filename: optimizedData.filename,
        size: optimizedData.size,
        mimetype: optimizedData.mimetype,
        processingProgress: 50,
      },
      { new: true }
    );

    // 3. Sensitivity Analysis (50% to 100% progress)
    const result = await analyzeVideo(optimizedVideo, (percent, message) => {
      const totalProgress = 50 + Math.floor(percent / 2); // Map 0-100 to 50-100
      io.to(video.tenantId).emit('video:processing_progress', {
        videoId: video._id,
        progress: totalProgress,
        message,
      });
    });

    // 4. Update final completion
    const finalVideo = await Video.findByIdAndUpdate(
      video._id,
      {
        status: 'completed',
        processingProgress: 100,
        sensitivityStatus: result.status,
        sensitivityDetails: {
          score: result.score,
          categories: result.categories,
          analyzedAt: new Date(),
        },
      },
      { new: true }
    );

    // Notify client that processing is complete
    io.to(video.tenantId).emit('video:processing_complete', {
      videoId: video._id,
      status: result.status,
      sensitivityDetails: finalVideo.sensitivityDetails,
    });

    console.log(`Video ${video._id} processing complete: ${result.status}`);
  } catch (error) {
    console.error(`Error processing video ${video._id}:`, error.message);

    await Video.findByIdAndUpdate(video._id, {
      status: 'failed',
      processingProgress: 0,
    });

    io.to(video.tenantId).emit('video:processing_failed', {
      videoId: video._id,
      error: error.message,
    });
  }
};

module.exports = { processVideo };
