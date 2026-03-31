const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const config = require('../config');

/**
 * Optimizes a video for efficient streaming (e.g., resizing, standardizing format).
 * Note: Requires FFmpeg installed on the system.
 * 
 * @param {Object} video - Mongoose Video document
 * @param {Function} onProgress - Callback for progress (0-100)
 * @returns {Promise<Object>} - The new file details { filename, size }
 */
const optimizeVideo = (video, onProgress) => {
  return new Promise((resolve, reject) => {
    const inputPath = path.join(config.uploadDir, video.filename);
    const outputFilename = `opt_${video.filename}.mp4`;
    const outputPath = path.join(config.uploadDir, outputFilename);

    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      return reject(new Error('Input video file not found'));
    }

    try {
      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',     // Video codec
          '-preset fast',     // Compression preset
          '-crf 28',          // Constant Rate Factor (quality vs size)
          '-c:a aac',         // Audio codec
          '-b:a 128k',        // Audio bitrate
          '-vf scale=-2:720', // Scale to 720p height, preserve aspect ratio
          '-movflags +faststart' // Move MOOV atom to beginning for streaming
        ])
        .output(outputPath)
        .on('progress', (progress) => {
          if (progress.percent && onProgress) {
            onProgress(Math.min(Math.round(progress.percent), 99));
          }
        })
        .on('end', () => {
          try {
            // Get new file size
            const stats = fs.statSync(outputPath);
            
            // Try to delete original file
            try {
              fs.unlinkSync(inputPath);
            } catch (err) {
              console.warn('Could not delete original file:', err.message);
            }

            resolve({
              filename: outputFilename,
              size: stats.size,
              mimetype: 'video/mp4'
            });
          } catch (err) {
            reject(new Error('Failed to read optimized file size'));
          }
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err.message);
          // If FFmpeg is missing or fails, just resolve with original file
          // so the process doesn't completely fail for the demo
          resolve({
            filename: video.filename,
            size: video.size,
            mimetype: video.mimetype
          });
        })
        .run();
    } catch (err) {
      console.warn('FFmpeg execution failed, skipping optimization:', err.message);
      resolve({
        filename: video.filename,
        size: video.size,
        mimetype: video.mimetype
      });
    }
  });
};

module.exports = { optimizeVideo };
