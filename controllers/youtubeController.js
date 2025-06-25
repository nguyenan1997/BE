const YouTubeChannel = require("../models/YouTubeChannel");
const {
  analyzeMultipleYouTubeImages,
} = require("../config/gemini");
const path = require("path");
const fs = require("fs").promises;
const axios = require("axios");

// Fetch multiple images and analyze YouTube channel with all images
const fetchAndAnalyze = async (req, res, next) => {
  try {
    // Use default URLs if imageUrls is not provided in request body
    const imageUrls = req.body?.imageUrls || [
      "http://10.31.0.66//green-box/screenshots/inspector_30_30109_1750751156.png",
      "http://10.31.0.66//green-box/screenshots/inspector_30_30109_1750751156.png",
    ];

    // Validate input
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: "imageUrls array is required with at least one URL",
      });
    }

    // Validate URLs
    for (const url of imageUrls) {
      if (!url || !url.startsWith("http")) {
        return res.status(400).json({
          success: false,
          message: "All image URLs must be valid HTTP URLs",
        });
      }
    }

    // Create YouTube channel record with pending status and user ID
    const youtubeChannel = await YouTubeChannel.create({
      channelName: "Analyzing...",
      analysisStatus: "processing",
      imageUrl: imageUrls.join("|"), // Store all URLs separated by |
      originalImageName: `${imageUrls.length}-images.jpg`,
      analyzedBy: req.user.userId, // Lưu ID của user đang tạo
    });

    // Start AI analysis in background
    fetchAndAnalyzeMultipleImages(imageUrls, youtubeChannel.id);

    res.status(202).json({
      success: true,
      message: "Images fetched and analysis started",
      data: {
        id: youtubeChannel.id,
        status: "processing",
        message: "AI analysis is in progress. Check status later.",
        imageCount: imageUrls.length,
        imageUrls: imageUrls,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Background function to fetch multiple images and analyze with AI
const fetchAndAnalyzeMultipleImages = async (imageUrls, channelId) => {
  try {
    // Update status to processing
    await YouTubeChannel.update(
      { analysisStatus: "processing" },
      { where: { id: channelId } }
    );

    console.log(`📥 Fetching ${imageUrls.length} images...`);

    // Fetch all images
    const imageBuffers = [];
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        console.log(
          `📥 Fetching image ${i + 1}/${imageUrls.length}: ${imageUrls[i]}`
        );
        const imageResponse = await axios.get(imageUrls[i], {
          responseType: "arraybuffer",
          timeout: 30000, // 30 seconds timeout
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        const imageBuffer = Buffer.from(imageResponse.data);
        imageBuffers.push(imageBuffer);
        console.log(
          `✅ Image ${i + 1} fetched successfully, size: ${
            imageBuffer.length
          } bytes`
        );
      } catch (error) {
        console.error(`❌ Failed to fetch image ${i + 1}:`, error.message);
        throw new Error(`Failed to fetch image ${i + 1}: ${error.message}`);
      }
    }

    console.log(`✅ All ${imageBuffers.length} images fetched successfully`);

    // Analyze with Gemini AI using all images
    const analysisResult = await analyzeMultipleYouTubeImages(
      imageBuffers,
      imageUrls
    );

    if (analysisResult.success) {
      const analysisData = analysisResult.data;

      // Update channel with AI analysis results
      await YouTubeChannel.update(
        {
          channelName: analysisData.channelName || "Unknown",
          subscriberCount: analysisData.subscriberCount || null,
          totalViews: analysisData.totalViews || null,
          estimatedRevenue: analysisData.estimatedRevenue || null,
          watchTime: analysisData.watchTime || null,
          views48h: analysisData.views48h || null,
          views60min: analysisData.views60min || null,
          recentVideos: analysisData.recentVideos || null,
          description: analysisData.description || null,
          category: analysisData.category || null,
          joinDate: analysisData.joinDate || null,
          location: analysisData.location || null,
          socialLinks: analysisData.socialLinks || null,
          aiAnalysis: analysisData.aiAnalysis || null,
          monetizationWarning: analysisData.warnings?.monetizationWarning?.hasWarning || false,
          monetizationWarningReason: analysisData.warnings?.monetizationWarning?.reason || null,
          monetizationWarningDate: analysisData.warnings?.monetizationWarning?.date || null,
          communityGuidelinesWarning: analysisData.warnings?.communityGuidelinesWarning?.hasWarning || false,
          communityGuidelinesWarningReason: analysisData.warnings?.communityGuidelinesWarning?.reason || null,
          communityGuidelinesWarningDate: analysisData.warnings?.communityGuidelinesWarning?.date || null,
          warnings: analysisData.warnings || null,
          analysisStatus: "completed",
        },
        {
          where: { id: channelId },
        }
      );

      console.log(`✅ AI analysis completed for channel ${channelId}`);
    } else {
      // Update with error status
      await YouTubeChannel.update(
        {
          analysisStatus: "failed",
          analysisError: analysisResult.error,
        },
        {
          where: { id: channelId },
        }
      );

      console.error(
        `❌ AI analysis failed for channel ${channelId}:`,
        analysisResult.error
      );
    }
  } catch (error) {
    console.error("Fetch and AI Analysis Error:", error);

    // Update with error status
    await YouTubeChannel.update(
      {
        analysisStatus: "failed",
        analysisError: error.message,
      },
      {
        where: { id: channelId },
      }
    );
  }
};

// Get analysis status
const getAnalysisStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Tìm channel và kiểm tra quyền sở hữu
    const channel = await YouTubeChannel.findOne({
      where: {
        id: id,
        analyzedBy: req.user.userId // Chỉ lấy channel của user hiện tại
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "YouTube channel not found or access denied",
      });
    }

    res.json({
      success: true,
      data: {
        id: channel.id,
        status: channel.analysisStatus,
        channelName: channel.channelName,
        imageUrl: channel.imageUrl,
        error: channel.analysisError,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get completed analysis result
const getAnalysisResult = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Tìm channel và kiểm tra quyền sở hữu
    const channel = await YouTubeChannel.findOne({
      where: {
        id: id,
        analyzedBy: req.user.userId // Chỉ lấy channel của user hiện tại
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "YouTube channel not found or access denied",
      });
    }

    if (channel.analysisStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: `Analysis is ${channel.analysisStatus}. Please wait or check status.`,
        data: {
          status: channel.analysisStatus,
          error: channel.analysisError,
        },
      });
    }

    res.json({
      success: true,
      data: {
        id: channel.id,
        channelName: channel.channelName,
        subscriberCount: channel.subscriberCount,
        totalViews: channel.totalViews,
        estimatedRevenue: channel.estimatedRevenue,
        watchTime: channel.watchTime,
        views48h: channel.views48h,
        views60min: channel.views60min,
        recentVideos: channel.recentVideos,
        description: channel.description,
        category: channel.category,
        joinDate: channel.joinDate,
        location: channel.location,
        socialLinks: channel.socialLinks,
        aiAnalysis: channel.aiAnalysis,
        imageUrl: channel.imageUrl,
        originalImageName: channel.originalImageName,
        monetizationWarning: channel.monetizationWarning,
        monetizationWarningReason: channel.monetizationWarningReason,
        monetizationWarningDate: channel.monetizationWarningDate,
        communityGuidelinesWarning: channel.communityGuidelinesWarning,
        communityGuidelinesWarningReason: channel.communityGuidelinesWarningReason,
        communityGuidelinesWarningDate: channel.communityGuidelinesWarningDate,
        warnings: channel.warnings,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all YouTube channels for user
const getAllChannels = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { count, rows: channels } = await YouTubeChannel.findAndCountAll({
      where: {
        analyzedBy: req.user.userId
      },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        channels: channels.map((channel) => ({
          id: channel.id,
          channelName: channel.channelName,
          analysisStatus: channel.analysisStatus,
          imageUrl: channel.imageUrl,
          // Thông tin cảnh báo
          monetizationWarning: channel.monetizationWarning,
          communityGuidelinesWarning: channel.communityGuidelinesWarning,
          warnings: channel.warnings,
          createdAt: channel.createdAt,
          updatedAt: channel.updatedAt,
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete YouTube channel
const deleteChannel = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Tìm channel và kiểm tra quyền sở hữu
    const channel = await YouTubeChannel.findOne({
      where: {
        id: id,
        analyzedBy: req.user.userId // Chỉ lấy channel của user hiện tại
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "YouTube channel not found or access denied",
      });
    }

    // Delete image file if exists
    if (channel.imageUrl) {
      try {
        const imagePath = path.join(
          __dirname,
          "..",
          "public",
          channel.imageUrl
        );
        await fs.unlink(imagePath);
      } catch (fileError) {
        console.error("Error deleting image file:", fileError);
      }
    }

    // Delete from database
    await channel.destroy();

    res.json({
      success: true,
      message: "YouTube channel deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update channel warnings manually
const updateChannelWarnings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      monetizationWarning,
      monetizationWarningReason,
      monetizationWarningDate,
      communityGuidelinesWarning,
      communityGuidelinesWarningReason,
      communityGuidelinesWarningDate,
      warnings
    } = req.body;

    // Tìm channel và kiểm tra quyền sở hữu
    const channel = await YouTubeChannel.findOne({
      where: {
        id: id,
        analyzedBy: req.user.userId // Chỉ lấy channel của user hiện tại
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "YouTube channel not found or access denied",
      });
    }

    // Cập nhật thông tin cảnh báo
    const updateData = {};
    
    if (monetizationWarning !== undefined) {
      updateData.monetizationWarning = monetizationWarning;
    }
    if (monetizationWarningReason !== undefined) {
      updateData.monetizationWarningReason = monetizationWarningReason;
    }
    if (monetizationWarningDate !== undefined) {
      updateData.monetizationWarningDate = monetizationWarningDate;
    }
    if (communityGuidelinesWarning !== undefined) {
      updateData.communityGuidelinesWarning = communityGuidelinesWarning;
    }
    if (communityGuidelinesWarningReason !== undefined) {
      updateData.communityGuidelinesWarningReason = communityGuidelinesWarningReason;
    }
    if (communityGuidelinesWarningDate !== undefined) {
      updateData.communityGuidelinesWarningDate = communityGuidelinesWarningDate;
    }
    if (warnings !== undefined) {
      updateData.warnings = warnings;
    }

    await channel.update(updateData);

    res.json({
      success: true,
      message: "Channel warnings updated successfully",
      data: {
        id: channel.id,
        channelName: channel.channelName,
        monetizationWarning: channel.monetizationWarning,
        monetizationWarningReason: channel.monetizationWarningReason,
        monetizationWarningDate: channel.monetizationWarningDate,
        communityGuidelinesWarning: channel.communityGuidelinesWarning,
        communityGuidelinesWarningReason: channel.communityGuidelinesWarningReason,
        communityGuidelinesWarningDate: channel.communityGuidelinesWarningDate,
        warnings: channel.warnings,
        updatedAt: channel.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  fetchAndAnalyze,
  getAnalysisStatus,
  getAnalysisResult,
  getAllChannels,
  deleteChannel,
  updateChannelWarnings,
};
