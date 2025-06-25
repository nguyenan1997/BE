const Joi = require('joi');

// Validation schema for manually adding YouTube channel
const addChannelSchema = Joi.object({
  channelName: Joi.string().required().min(1).max(200).messages({
    'string.empty': 'Channel name is required',
    'string.min': 'Channel name must be at least 1 character long',
    'string.max': 'Channel name cannot exceed 200 characters'
  }),
  subscriberCount: Joi.string().optional().max(50),
  totalViews: Joi.string().optional().max(100),
  estimatedRevenue: Joi.string().optional().max(100),
  watchTime: Joi.string().optional().max(100),
  views48h: Joi.string().optional().max(100),
  views60min: Joi.string().optional().max(100),
  description: Joi.string().optional().max(1000),
  category: Joi.string().optional().max(100),
  joinDate: Joi.string().optional().max(100),
  location: Joi.string().optional().max(100),
  socialLinks: Joi.object().optional(),
  imageUrl: Joi.string().optional().uri(),
  monetizationWarning: Joi.boolean().optional(),
  monetizationWarningReason: Joi.string().optional().max(500),
  communityGuidelinesWarning: Joi.boolean().optional(),
  communityGuidelinesWarningReason: Joi.string().optional().max(500)
});

// Validation schema for analyzing channel from URL
const analyzeChannelUrlSchema = Joi.object({
  channelUrl: Joi.string().required().uri().pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/).messages({
    'string.empty': 'Channel URL is required',
    'string.uri': 'Channel URL must be a valid URL',
    'string.pattern.base': 'Channel URL must be a valid YouTube URL'
  })
});

// Validation schema for updating channel warnings
const updateWarningsSchema = Joi.object({
  monetizationWarning: Joi.boolean().required(),
  monetizationWarningReason: Joi.string().optional().max(500),
  communityGuidelinesWarning: Joi.boolean().required(),
  communityGuidelinesWarningReason: Joi.string().optional().max(500)
});

// Middleware to validate add channel request
const validateAddChannel = (req, res, next) => {
  const { error } = addChannelSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// Middleware to validate channel URL analysis request
const validateChannelUrl = (req, res, next) => {
  const { error } = analyzeChannelUrlSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

// Middleware to validate update warnings request
const validateUpdateWarnings = (req, res, next) => {
  const { error } = updateWarningsSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateAddChannel,
  validateChannelUrl,
  validateUpdateWarnings
}; 