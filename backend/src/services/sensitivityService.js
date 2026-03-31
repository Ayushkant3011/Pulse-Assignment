const Video = require('../models/Video');

/**
 * Simulates video sensitivity analysis.
 * In production, replace this with a real API call to
 * Google Video Intelligence, AWS Rekognition, or Hive Moderation.
 *
 * @param {Object} video - Mongoose Video document
 * @param {Function} onProgress - Callback for progress updates (0-100)
 * @returns {Object} - Analysis result { status, score, categories }
 */
const analyzeVideo = async (video, onProgress) => {
  const totalSteps = 10;

  for (let step = 1; step <= totalSteps; step++) {
    // Simulate processing time (1-2 seconds per step)
    await new Promise((resolve) =>
      setTimeout(resolve, 800 + Math.random() * 1200)
    );

    const progress = Math.round((step / totalSteps) * 100);

    // Update progress in DB
    await Video.findByIdAndUpdate(video._id, {
      processingProgress: progress,
    });

    // Notify via callback
    if (onProgress) {
      onProgress(progress, `Processing step ${step}/${totalSteps}`);
    }
  }

  // Simulate sensitivity result
  // Random score between 0 and 1: < 0.5 = safe, >= 0.5 = flagged
  const score = Math.random();
  const isFlagged = score >= 0.5;

  const categories = [];
  if (isFlagged) {
    const possibleCategories = [
      'violence',
      'adult_content',
      'hate_speech',
      'dangerous_activities',
      'graphic_content',
    ];
    // Pick 1-2 random categories
    const count = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * possibleCategories.length);
      if (!categories.includes(possibleCategories[idx])) {
        categories.push(possibleCategories[idx]);
      }
    }
  }

  return {
    status: isFlagged ? 'flagged' : 'safe',
    score: Math.round(score * 100) / 100,
    categories,
  };
};

module.exports = { analyzeVideo };
