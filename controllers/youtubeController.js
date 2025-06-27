const {
  YouTubeChannel,
  ChannelStatistics,
  ChannelWarning,
  ChannelVideo,
  ChannelAnalysis
} = require("../models");
const {
  analyzeMultipleYouTubeImages,
} = require("../config/gemini");
const { parseViewCount } = require("../utils/parseUtils");
const path = require("path");
const fs = require("fs").promises;
const axios = require("axios");

// Fetch multiple images and analyze YouTube channel with all images
const fetchAndAnalyze = async (req, res, next) => {
  try {
    // Use default URLs if imageUrls is not provided in request body
    const imageUrls = req.body?.imageUrls || [
      "https://media.discordapp.net/attachments/1380449824138203288/1381211431655178381/IMG_1229.png?ex=685f14a2&is=685dc322&hm=39d791a69cddf8df6d9b0b8bb4dc1d6a3d124e52250ab6e24f8ef25fc6384123&=&format=webp&quality=lossless&width=250&height=543",
      "https://media.discordapp.net/attachments/1380449824138203288/1381211432456163459/IMG_1230.png?ex=685f14a3&is=685dc323&hm=c7b529ec2372e07baf40f12e3f8007e477b0e6efed4525d53a3564fd454f789b&=&format=webp&quality=lossless&width=250&height=543",
      "https://media.discordapp.net/attachments/1380449824138203288/1381211433118994462/IMG_1231.png?ex=685f14a3&is=685dc323&hm=bba14f4a43f1604eff3111e33486f4734fc869f4d340de1664028a9251998c06&=&format=webp&quality=lossless&width=250&height=543",
      "https://media.discordapp.net/attachments/1380449824138203288/1381211433865318410/IMG_1232.png?ex=685f14a3&is=685dc323&hm=9361f9a99d029289b14849e75e53615a6db4023d4dda031f1b9ae822d4c8bd02&=&format=webp&quality=lossless&width=250&height=543",
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
      userId: req.user.userId, // User sở hữu channel
      channelName: "Analyzing...",
      analysisStatus: "processing",
      imageUrl: imageUrls.join("|"),
      originalImageName: `${imageUrls.length}-images.jpg`,
      analyzedBy: req.user.userId, // User thực hiện phân tích
    });

    // Start AI analysis in background
    fetchAndAnalyzeMultipleImages(imageUrls, youtubeChannel.id, req.user.userId);

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
const fetchAndAnalyzeMultipleImages = async (imageUrls, channelId, userId) => {
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

      // Update channel with basic information
      await YouTubeChannel.update(
        {
          channelName: analysisData.channelName || "Unknown",
          description: analysisData.description || null,
          category: analysisData.category || null,
          joinDate: analysisData.joinDate || null,
          location: analysisData.location || null,
          socialLinks: analysisData.socialLinks || null,
          analysisStatus: "completed",
        },
        {
          where: { id: channelId },
        }
      );

      // Save statistics to channel_statistics table
      if (analysisData.subscriberCount || analysisData.totalViews || 
          analysisData.estimatedRevenue || analysisData.watchTime || 
          analysisData.views48h || analysisData.views60min) {
        
        await ChannelStatistics.create({
          channelId: channelId,
          subscriberCount: analysisData.subscriberCount || null,
          totalViews: analysisData.totalViews || null,
          estimatedRevenue: analysisData.estimatedRevenue || null,
          watchTime: analysisData.watchTime || null,
          views48h: analysisData.views48h || null,
          views60min: analysisData.views60min || null,
          recordedAt: new Date()
        });
      }

      // Save videos to channel_videos table
      if (analysisData.recentVideos && Array.isArray(analysisData.recentVideos)) {
        for (const video of analysisData.recentVideos) {
          await ChannelVideo.create({
            channelId: channelId,
            videoId: video.videoId || `video_${Date.now()}_${Math.random()}`,
            title: video.title || null,
            description: video.description || null,
            thumbnailUrl: video.thumbnailUrl || video.thumbnail || null,
            publishedAt: video.publishedAt ? new Date(video.publishedAt) : null,
            duration: video.duration || null,
            viewCount: parseViewCount(video.viewCount || video.views),
            likeCount: parseViewCount(video.likeCount || video.likes),
            commentCount: parseViewCount(video.commentCount || video.comments),
            isRecent: true,
            recordedAt: new Date()
          });
        }
      }

      // Save warnings to channel_warnings table
      if (analysisData.warnings) {
        // Handle monetization warnings
        if (analysisData.warnings.monetizationWarning?.hasWarning) {
          await ChannelWarning.create({
            channelId: channelId,
            warningType: 'monetization',
            isActive: analysisData.warnings.monetizationWarning.hasWarning,
            reason: analysisData.warnings.monetizationWarning.reason || null,
            warningDate: analysisData.warnings.monetizationWarning.date ? 
              new Date(analysisData.warnings.monetizationWarning.date) : new Date(),
            severity: 'high'
          });
        }

        // Handle community guidelines warnings
        if (analysisData.warnings.communityGuidelinesWarning?.hasWarning) {
          await ChannelWarning.create({
            channelId: channelId,
            warningType: 'community_guidelines',
            isActive: analysisData.warnings.communityGuidelinesWarning.hasWarning,
            reason: analysisData.warnings.communityGuidelinesWarning.reason || null,
            warningDate: analysisData.warnings.communityGuidelinesWarning.date ? 
              new Date(analysisData.warnings.communityGuidelinesWarning.date) : new Date(),
            severity: 'high'
          });
        }

        // Handle other warnings
        if (analysisData.warnings.other && Array.isArray(analysisData.warnings.other)) {
          for (const warning of analysisData.warnings.other) {
            await ChannelWarning.create({
              channelId: channelId,
              warningType: warning.type || 'other',
              isActive: warning.isActive !== false,
              reason: warning.reason || null,
              details: warning,
              warningDate: warning.date ? new Date(warning.date) : new Date(),
              severity: warning.severity || 'medium'
            });
          }
        }
      }

      // Save AI analysis to channel_analyses table
      if (analysisData.aiAnalysis || analysisData) {
        await ChannelAnalysis.create({
          channelId: channelId,
          analysisType: 'content_analysis',
          analysisData: analysisData.aiAnalysis || analysisData,
          summary: analysisData.aiAnalysis?.summary || analysisData.summary || null,
          confidence: analysisData.aiAnalysis?.confidence || 0.8,
          analyzedAt: new Date(),
          isLatest: true
        });
      }

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

    const channel = await YouTubeChannel.findOne({
      where: {
        id: id,
        analyzedBy: req.user.userId
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

    const channel = await YouTubeChannel.findOne({
      where: {
        id: id,
        userId: req.user.userId // User sở hữu channel
      },
      include: [
        {
          model: ChannelStatistics,
          as: 'statistics',
          order: [['recordedAt', 'DESC']],
          limit: 1
        },
        {
          model: ChannelWarning,
          as: 'warnings',
          where: { isActive: true }
        },
        {
          model: ChannelVideo,
          as: 'videos',
          where: { isRecent: true },
          order: [['publishedAt', 'DESC']],
          limit: 5
        },
        {
          model: ChannelAnalysis,
          as: 'analyses',
          where: { isLatest: true },
          limit: 1
        }
      ]
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

    // Lấy thống kê mới nhất
    const latestStats = channel.statistics && channel.statistics.length > 0 ? 
      channel.statistics[0] : null;

    // Lấy phân tích AI mới nhất
    const latestAnalysis = channel.analyses && channel.analyses.length > 0 ? 
      channel.analyses[0] : null;

    res.json({
      success: true,
      data: {
        id: channel.id,
        channelName: channel.channelName,
        description: channel.description,
        category: channel.category,
        joinDate: channel.joinDate,
        location: channel.location,
        imageUrl: channel.imageUrl,
        originalImageName: channel.originalImageName,
        analysisStatus: channel.analysisStatus,
        analysisError: channel.analysisError,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
        
        // Thống kê từ bảng channel_statistics
        statistics: latestStats ? {
          subscriberCount: latestStats.subscriberCount,
          totalViews: latestStats.totalViews,
          estimatedRevenue: latestStats.estimatedRevenue,
          watchTime: latestStats.watchTime,
          views48h: latestStats.views48h,
          views60min: latestStats.views60min,
          recordedAt: latestStats.recordedAt
        } : null,
        
        // Videos từ bảng channel_videos
        videos: channel.videos || [],
        
        // Warnings từ bảng channel_warnings
        warnings: channel.warnings || [],
        
        // Social links từ field socialLinks
        socialLinks: channel.socialLinks || null,
        
        // AI analysis từ bảng channel_analyses
        aiAnalysis: latestAnalysis ? {
          analysisData: latestAnalysis.analysisData,
          summary: latestAnalysis.summary,
          confidence: latestAnalysis.confidence,
          analyzedAt: latestAnalysis.analyzedAt
        } : null
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
        userId: req.user.userId // User sở hữu channels
      },
      include: [
        {
          model: ChannelStatistics,
          as: 'statistics',
          order: [['recordedAt', 'DESC']],
          limit: 1
        },
        {
          model: ChannelWarning,
          as: 'warnings',
          where: { isActive: true }
        }
      ],
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    // Format response data
    const formattedChannels = channels.map(channel => {
      const latestStats = channel.statistics && channel.statistics.length > 0 ? 
        channel.statistics[0] : null;
      
      const activeWarnings = channel.warnings || [];

      return {
        id: channel.id,
        channelName: channel.channelName,
        description: channel.description,
        category: channel.category,
        imageUrl: channel.imageUrl,
        analysisStatus: channel.analysisStatus,
        analysisError: channel.analysisError,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
        
        // Thống kê mới nhất
        statistics: latestStats ? {
          subscriberCount: latestStats.subscriberCount,
          totalViews: latestStats.totalViews,
          estimatedRevenue: latestStats.estimatedRevenue,
          recordedAt: latestStats.recordedAt
        } : null,
        
        // Số lượng cảnh báo đang hoạt động
        warningCount: activeWarnings.length
      };
    });

    res.json({
      success: true,
      data: {
        channels: formattedChannels,
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

    const channel = await YouTubeChannel.findOne({
      where: {
        id: id,
        userId: req.user.userId // User sở hữu channel
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "YouTube channel not found or access denied",
      });
    }

    // Delete related data from all tables
    await ChannelStatistics.destroy({
      where: { channelId: id }
    });

    await ChannelWarning.destroy({
      where: { channelId: id }
    });

    await ChannelVideo.destroy({
      where: { channelId: id }
    });

    await ChannelAnalysis.destroy({
      where: { channelId: id }
    });

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

// Update warning status (simplified)
const updateWarningStatus = async (req, res, next) => {
  try {
    const { id: channelId, warningId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['read', 'processing', 'resolved', 'ignored'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: read, processing, resolved, ignored"
      });
    }

    // Check if channel belongs to user
    const channel = await YouTubeChannel.findOne({
      where: {
        id: channelId,
        userId: req.user.userId
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "YouTube channel not found or access denied",
      });
    }

    // Find and update warning
    const warning = await ChannelWarning.findOne({
      where: {
        id: warningId,
        channelId: channelId
      }
    });

    if (!warning) {
      return res.status(404).json({
        success: false,
        message: "Warning not found",
      });
    }

    // Update status
    await warning.update({
      status: status,
      processedAt: status === 'resolved' ? new Date() : null,
      processedBy: req.user.userId
    });

    res.json({
      success: true,
      message: `Warning status updated to ${status}`,
      data: {
        warningId: warning.id,
        status: warning.status,
        processedAt: warning.processedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Manually add YouTube channel without AI analysis
const addChannelManually = async (req, res, next) => {
  try {
    const {
      channelName,
      subscriberCount,
      totalViews,
      estimatedRevenue,
      watchTime,
      views48h,
      views60min,
      description,
      category,
      joinDate,
      location,
      socialLinks,
      imageUrl,
      monetizationWarning,
      monetizationWarningReason,
      communityGuidelinesWarning,
      communityGuidelinesWarningReason
    } = req.body;

    // Validate required fields
    if (!channelName) {
      return res.status(400).json({
        success: false,
        message: "Channel name is required"
      });
    }

    // Create YouTube channel record
    const youtubeChannel = await YouTubeChannel.create({
      userId: req.user.userId, // User sở hữu channel
      channelName,
      description,
      category,
      joinDate,
      location,
      imageUrl,
      analysisStatus: "completed", // Manual entry is immediately completed
      analyzedBy: req.user.userId // User thực hiện phân tích
    });

    // Save statistics to channel_statistics table
    if (subscriberCount || totalViews || estimatedRevenue || watchTime || views48h || views60min) {
      await ChannelStatistics.create({
        channelId: youtubeChannel.id,
        subscriberCount: subscriberCount || null,
        totalViews: totalViews || null,
        estimatedRevenue: estimatedRevenue || null,
        watchTime: watchTime || null,
        views48h: views48h || null,
        views60min: views60min || null,
        recordedAt: new Date()
      });
    }

    // Save warnings to channel_warnings table
    if (monetizationWarning) {
      await ChannelWarning.create({
        channelId: youtubeChannel.id,
        warningType: 'monetization',
        isActive: monetizationWarning,
        reason: monetizationWarningReason || null,
        warningDate: new Date(),
        severity: 'high'
      });
    }

    if (communityGuidelinesWarning) {
      await ChannelWarning.create({
        channelId: youtubeChannel.id,
        warningType: 'community_guidelines',
        isActive: communityGuidelinesWarning,
        reason: communityGuidelinesWarningReason || null,
        warningDate: new Date(),
        severity: 'high'
      });
    }

    // Save social links to channel_social_links table
    if (socialLinks && typeof socialLinks === 'object') {
      for (const [platform, url] of Object.entries(socialLinks)) {
        if (url && typeof url === 'string') {
          await ChannelSocialLink.create({
            channelId: youtubeChannel.id,
            platform: platform.toLowerCase(),
            url: url,
            isActive: true
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: "YouTube channel added successfully",
      data: {
        id: youtubeChannel.id,
        channelName: youtubeChannel.channelName,
        description: youtubeChannel.description,
        category: youtubeChannel.category,
        analysisStatus: youtubeChannel.analysisStatus,
        createdAt: youtubeChannel.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Analyze YouTube channel from URL by fetching images from external API
const analyzeChannelFromUrl = async (req, res, next) => {
  try {
    const { channelUrl } = req.body;

    // Validate input
    if (!channelUrl) {
      return res.status(400).json({
        success: false,
        message: "Channel URL is required"
      });
    }

    // Validate YouTube URL format
    const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeUrlPattern.test(channelUrl)) {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube channel URL format"
      });
    }

    // Create YouTube channel record with pending status
    const youtubeChannel = await YouTubeChannel.create({
      channelName: "Analyzing...",
      analysisStatus: "processing",
      imageUrl: channelUrl, // Store the original URL
      originalImageName: "channel-url",
      analyzedBy: req.user.userId,
    });

    // Start analysis in background
    fetchChannelImagesAndAnalyze(channelUrl, youtubeChannel.id);

    res.status(202).json({
      success: true,
      message: "Channel analysis started",
      data: {
        id: youtubeChannel.id,
        status: "processing",
        message: "Fetching channel images and starting AI analysis. Check status later.",
        channelUrl: channelUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Background function to fetch channel images from external API and analyze
const fetchChannelImagesAndAnalyze = async (channelUrl, channelId) => {
  try {
    console.log(`🔗 Starting analysis for channel: ${channelUrl}`);

    // Step 1: Call external API to get channel images and info
    const externalApiResult = await fetchChannelDataFromExternalAPI(channelUrl);
    
    if (!externalApiResult.success) {
      throw new Error(`External API error: ${externalApiResult.error}`);
    }

    const { images, channelInfo } = externalApiResult.data;

    // Step 2: Fetch all images
    const imageBuffers = [];
    for (let i = 0; i < images.length; i++) {
      try {
        console.log(`📥 Fetching image ${i + 1}/${images.length}: ${images[i]}`);
        const imageResponse = await axios.get(images[i], {
          responseType: "arraybuffer",
          timeout: 30000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        const imageBuffer = Buffer.from(imageResponse.data);
        imageBuffers.push(imageBuffer);
        console.log(`✅ Image ${i + 1} fetched successfully, size: ${imageBuffer.length} bytes`);
      } catch (error) {
        console.error(`❌ Failed to fetch image ${i + 1}:`, error.message);
        throw new Error(`Failed to fetch image ${i + 1}: ${error.message}`);
      }
    }

    console.log(`✅ All ${imageBuffers.length} images fetched successfully`);

    // Step 3: Analyze with Gemini AI
    const analysisResult = await analyzeMultipleYouTubeImages(imageBuffers, images);

    if (analysisResult.success) {
      const analysisData = analysisResult.data;

      // Step 4: Update channel with combined data (external API + AI analysis)
      await YouTubeChannel.update(
        {
          channelName: channelInfo.channelName || analysisData.channelName || "Unknown",
          subscriberCount: channelInfo.subscriberCount || analysisData.subscriberCount || null,
          totalViews: channelInfo.totalViews || analysisData.totalViews || null,
          estimatedRevenue: analysisData.estimatedRevenue || null,
          watchTime: analysisData.watchTime || null,
          views48h: analysisData.views48h || null,
          views60min: analysisData.views60min || null,
          recentVideos: analysisData.recentVideos || null,
          description: channelInfo.description || analysisData.description || null,
          category: channelInfo.category || analysisData.category || null,
          joinDate: channelInfo.joinDate || analysisData.joinDate || null,
          location: channelInfo.location || analysisData.location || null,
          socialLinks: channelInfo.socialLinks || analysisData.socialLinks || null,
          aiAnalysis: analysisData.aiAnalysis || null,
          imageUrl: images.join("|"), // Store all image URLs
          originalImageName: `${images.length}-channel-images.jpg`,
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

      console.log(`✅ Channel analysis completed for ${channelId}`);
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

      console.error(`❌ AI analysis failed for channel ${channelId}:`, analysisResult.error);
    }
  } catch (error) {
    console.error("Channel URL Analysis Error:", error);

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

// Function to call external API for channel data
const fetchChannelDataFromExternalAPI = async (channelUrl) => {
  try {
    // TODO: Replace with your actual external API endpoint
    const externalApiUrl = process.env.EXTERNAL_CHANNEL_API_URL || 'https://api.example.com/youtube/channel';
    
    console.log(`🌐 Calling external API: ${externalApiUrl}`);
    
    const response = await axios.post(externalApiUrl, {
      channelUrl: channelUrl
    }, {
      timeout: 60000, // 60 seconds timeout
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXTERNAL_API_KEY || ''}` // If needed
      }
    });

    if (response.status === 200 && response.data.success) {
      return {
        success: true,
        data: response.data.data
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'External API returned error'
      };
    }
  } catch (error) {
    console.error('External API Error:', error.message);
    return {
      success: false,
      error: `External API call failed: ${error.message}`
    };
  }
};

// Get channel statistics history
const getChannelStatisticsHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const channel = await YouTubeChannel.findOne({
      where: {
        id: id,
        userId: req.user.userId
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "YouTube channel not found or access denied",
      });
    }

    const statistics = await ChannelStatistics.findAll({
      where: { channelId: id },
      order: [['recordedAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        channelId: id,
        channelName: channel.channelName,
        statistics: statistics
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get channel videos (with pagination)
const getChannelVideos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, recent = true } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const channel = await YouTubeChannel.findOne({
      where: {
        id: id,
        userId: req.user.userId
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "YouTube channel not found or access denied",
      });
    }

    const whereClause = { channelId: id };
    if (recent === 'true') {
      whereClause.isRecent = true;
    }

    const { count, rows: videos } = await ChannelVideo.findAndCountAll({
      where: whereClause,
      order: [['publishedAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: {
        channelId: id,
        channelName: channel.channelName,
        videos: videos,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get channel warnings
const getChannelWarnings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active = true } = req.query;

    const channel = await YouTubeChannel.findOne({
      where: {
        id: id,
        userId: req.user.userId
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "YouTube channel not found or access denied",
      });
    }

    const whereClause = { channelId: id };
    if (active === 'true') {
      whereClause.isActive = true;
    }

    const warnings = await ChannelWarning.findAll({
      where: whereClause,
      order: [['warningDate', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        channelId: id,
        channelName: channel.channelName,
        warnings: warnings
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get channel analysis history
const getChannelAnalysisHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    const channel = await YouTubeChannel.findOne({
      where: {
        id: id,
        userId: req.user.userId
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "YouTube channel not found or access denied",
      });
    }

    const analyses = await ChannelAnalysis.findAll({
      where: { channelId: id },
      order: [['analyzedAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        channelId: id,
        channelName: channel.channelName,
        analyses: analyses
      }
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
  updateWarningStatus,
  addChannelManually,
  analyzeChannelFromUrl,
  getChannelStatisticsHistory,
  getChannelVideos,
  getChannelWarnings,
  getChannelAnalysisHistory
};
