const Joi = require('joi');
const cron = require('node-cron');

// Validator for updating schedule
const validateUpdateSchedule = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(200).optional().messages({
      'string.min': 'Schedule name must have at least 1 character',
      'string.max': 'Schedule name cannot exceed 200 characters'
    }),
    description: Joi.string().max(1000).optional().messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
    cronExpression: Joi.string().custom((value, helpers) => {
      if (!cron.validate(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).optional().messages({
      'any.invalid': 'Invalid cron expression'
    }),
    maxRuns: Joi.number().integer().min(1).max(1000).optional().messages({
      'number.integer': 'Maximum runs must be an integer',
      'number.min': 'Maximum runs must be greater than 0',
      'number.max': 'Maximum runs cannot exceed 1000'
    }),
    isActive: Joi.boolean().optional().messages({
      'boolean.base': 'Active status must be boolean'
    }),
    settings: Joi.object().optional().messages({
      'object.base': 'Settings must be an object'
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid data',
      errors: error.details.map(detail => detail.message)
    });
  }

  next();
};

// Validator for query parameters
const validateScheduleQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional().messages({
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be greater than 0'
    }),
    limit: Joi.number().integer().min(1).max(100).optional().messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be greater than 0',
      'number.max': 'Limit cannot exceed 100'
    }),
    status: Joi.string().valid('active', 'inactive').optional().messages({
      'any.only': 'Status must be active or inactive'
    })
  });

  const { error } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: error.details.map(detail => detail.message)
    });
  }

  next();
};

// Helper function to create cron expression from specific time information
const createCronExpressionFromTime = (scheduleType, timeData) => {
  switch (scheduleType) {
    case 'minutely':
      return `* * * * *`;
    
    case 'hourly':
      return `0 * * * *`;
    
    case 'daily':
      const { hour, minute } = timeData;
      return `${minute} ${hour} * * *`;
    
    case 'weekly':
      const { hour: weekHour, minute: weekMinute, dayOfWeek } = timeData;
      return `${weekMinute} ${weekHour} * * ${dayOfWeek}`;
    
    case 'monthly':
      const { hour: monthHour, minute: monthMinute, dayOfMonth } = timeData;
      return `${monthMinute} ${monthHour} ${dayOfMonth} * *`;
    
    case 'yearly':
      const { hour: yearHour, minute: yearMinute, dayOfMonth: yearDay, month } = timeData;
      return `${yearMinute} ${yearHour} ${yearDay} ${month} *`;
    
    default:
      throw new Error('Invalid schedule type');
  }
};

// Validator for creating schedule from specific time information
const validateScheduleTime = (req, res, next) => {
  const schema = Joi.object({
    channelId: Joi.string().uuid().required().messages({
      'string.uuid': 'Channel ID must be a valid UUID',
      'any.required': 'Channel ID is required'
    }),
    name: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Schedule name must have at least 1 character',
      'string.max': 'Schedule name cannot exceed 200 characters',
      'any.required': 'Schedule name is required'
    }),
    description: Joi.string().max(1000).optional().messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
    scheduleType: Joi.string().valid('minutely', 'hourly', 'daily', 'weekly', 'monthly', 'yearly').required().messages({
      'any.only': 'Schedule type must be minutely, hourly, daily, weekly, monthly or yearly',
      'any.required': 'Schedule type is required'
    }),
    time: Joi.object({
      hour: Joi.number().integer().min(0).max(23).when('$scheduleType', {
        is: Joi.string().valid('minutely', 'hourly'),
        then: Joi.optional(),
        otherwise: Joi.required()
      }).messages({
        'number.integer': 'Hour must be an integer',
        'number.min': 'Hour must be between 0-23',
        'number.max': 'Hour must be between 0-23',
        'any.required': 'Hour is required for this schedule type'
      }),
      minute: Joi.number().integer().min(0).max(59).when('$scheduleType', {
        is: Joi.string().valid('minutely', 'hourly'),
        then: Joi.optional(),
        otherwise: Joi.required()
      }).messages({
        'number.integer': 'Minute must be an integer',
        'number.min': 'Minute must be between 0-59',
        'number.max': 'Minute must be between 0-59',
        'any.required': 'Minute is required for this schedule type'
      }),
      dayOfWeek: Joi.number().integer().min(0).max(6).when('$scheduleType', {
        is: 'weekly',
        then: Joi.required(),
        otherwise: Joi.optional()
      }).messages({
        'number.integer': 'Day of week must be an integer',
        'number.min': 'Day of week must be between 0-6 (0=Sunday)',
        'number.max': 'Day of week must be between 0-6 (0=Sunday)',
        'any.required': 'Day of week is required for weekly schedule'
      }),
      dayOfMonth: Joi.number().integer().min(1).max(31).when('$scheduleType', {
        is: Joi.string().valid('monthly', 'yearly'),
        then: Joi.required(),
        otherwise: Joi.optional()
      }).messages({
        'number.integer': 'Day of month must be an integer',
        'number.min': 'Day of month must be between 1-31',
        'number.max': 'Day of month must be between 1-31',
        'any.required': 'Day of month is required for monthly/yearly schedule'
      }),
      month: Joi.number().integer().min(1).max(12).when('$scheduleType', {
        is: 'yearly',
        then: Joi.required(),
        otherwise: Joi.optional()
      }).messages({
        'number.integer': 'Month must be an integer',
        'number.min': 'Month must be between 1-12',
        'number.max': 'Month must be between 1-12',
        'any.required': 'Month is required for yearly schedule'
      })
    }).required().messages({
      'object.base': 'Time information must be an object'
    }),
    maxRuns: Joi.number().integer().min(1).max(1000).optional().messages({
      'number.integer': 'Maximum runs must be an integer',
      'number.min': 'Maximum runs must be greater than 0',
      'number.max': 'Maximum runs cannot exceed 1000'
    }),
    settings: Joi.object().optional().messages({
      'object.base': 'Settings must be an object'
    })
  });

  const { error } = schema.validate(req.body, { context: { scheduleType: req.body.scheduleType } });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid data',
      errors: error.details.map(detail => detail.message)
    });
  }

  // Create cron expression from time information
  try {
    const cronExpression = createCronExpressionFromTime(
      req.body.scheduleType,
      req.body.time
    );
    req.body.cronExpression = cronExpression;
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Cannot create cron expression',
      error: error.message
    });
  }

  next();
};

module.exports = {
  validateUpdateSchedule,
  validateScheduleQuery,
  validateScheduleTime,
  createCronExpressionFromTime
}; 