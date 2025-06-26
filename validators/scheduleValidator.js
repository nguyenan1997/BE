const Joi = require('joi');
const cron = require('node-cron');

// Validator cho tạo lịch mới
const validateCreateSchedule = (req, res, next) => {
  const schema = Joi.object({
    channelId: Joi.string().uuid().required().messages({
      'string.uuid': 'ID kênh phải là UUID hợp lệ',
      'any.required': 'ID kênh là bắt buộc'
    }),
    name: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Tên lịch phải có ít nhất 1 ký tự',
      'string.max': 'Tên lịch không được quá 200 ký tự',
      'any.required': 'Tên lịch là bắt buộc'
    }),
    description: Joi.string().max(1000).optional().messages({
      'string.max': 'Mô tả không được quá 1000 ký tự'
    }),
    cronExpression: Joi.string().custom((value, helpers) => {
      if (!cron.validate(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required().messages({
      'any.invalid': 'Biểu thức cron không hợp lệ',
      'any.required': 'Biểu thức cron là bắt buộc'
    }),
    maxRuns: Joi.number().integer().min(1).max(1000).optional().messages({
      'number.integer': 'Số lần chạy tối đa phải là số nguyên',
      'number.min': 'Số lần chạy tối đa phải lớn hơn 0',
      'number.max': 'Số lần chạy tối đa không được quá 1000'
    }),
    settings: Joi.object().optional().messages({
      'object.base': 'Cài đặt phải là object'
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: error.details.map(detail => detail.message)
    });
  }

  next();
};

// Validator cho cập nhật lịch
const validateUpdateSchedule = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(200).optional().messages({
      'string.min': 'Tên lịch phải có ít nhất 1 ký tự',
      'string.max': 'Tên lịch không được quá 200 ký tự'
    }),
    description: Joi.string().max(1000).optional().messages({
      'string.max': 'Mô tả không được quá 1000 ký tự'
    }),
    cronExpression: Joi.string().custom((value, helpers) => {
      if (!cron.validate(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).optional().messages({
      'any.invalid': 'Biểu thức cron không hợp lệ'
    }),
    maxRuns: Joi.number().integer().min(1).max(1000).optional().messages({
      'number.integer': 'Số lần chạy tối đa phải là số nguyên',
      'number.min': 'Số lần chạy tối đa phải lớn hơn 0',
      'number.max': 'Số lần chạy tối đa không được quá 1000'
    }),
    isActive: Joi.boolean().optional().messages({
      'boolean.base': 'Trạng thái hoạt động phải là boolean'
    }),
    settings: Joi.object().optional().messages({
      'object.base': 'Cài đặt phải là object'
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: error.details.map(detail => detail.message)
    });
  }

  next();
};

// Validator cho query parameters
const validateScheduleQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional().messages({
      'number.integer': 'Trang phải là số nguyên',
      'number.min': 'Trang phải lớn hơn 0'
    }),
    limit: Joi.number().integer().min(1).max(100).optional().messages({
      'number.integer': 'Giới hạn phải là số nguyên',
      'number.min': 'Giới hạn phải lớn hơn 0',
      'number.max': 'Giới hạn không được quá 100'
    }),
    status: Joi.string().valid('active', 'inactive').optional().messages({
      'any.only': 'Trạng thái phải là active hoặc inactive'
    })
  });

  const { error } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Tham số query không hợp lệ',
      errors: error.details.map(detail => detail.message)
    });
  }

  next();
};

// Helper function để tạo cron expression từ các tham số
const createCronExpression = (frequency, time, dayOfWeek = null, dayOfMonth = null) => {
  switch (frequency) {
    case 'minutely':
      return `* * * * *`;
    case 'hourly':
      return `0 * * * *`;
    case 'daily':
      const [hour, minute] = time.split(':');
      return `${minute} ${hour} * * *`;
    case 'weekly':
      const [weekHour, weekMinute] = time.split(':');
      return `${weekMinute} ${weekHour} * * ${dayOfWeek}`;
    case 'monthly':
      const [monthHour, monthMinute] = time.split(':');
      return `${monthMinute} ${monthHour} ${dayOfMonth} * *`;
    default:
      throw new Error('Tần suất không hợp lệ');
  }
};

// Validator cho tạo cron expression từ form
const validateCronForm = (req, res, next) => {
  const schema = Joi.object({
    frequency: Joi.string().valid('minutely', 'hourly', 'daily', 'weekly', 'monthly').required().messages({
      'any.only': 'Tần suất phải là minutely, hourly, daily, weekly hoặc monthly',
      'any.required': 'Tần suất là bắt buộc'
    }),
    time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).when('frequency', {
      is: Joi.string().valid('minutely', 'hourly'),
      then: Joi.optional(),
      otherwise: Joi.required()
    }).messages({
      'string.pattern.base': 'Thời gian phải có định dạng HH:MM',
      'any.required': 'Thời gian là bắt buộc cho tần suất này'
    }),
    dayOfWeek: Joi.number().min(0).max(6).when('frequency', {
      is: 'weekly',
      then: Joi.required(),
      otherwise: Joi.optional()
    }).messages({
      'number.min': 'Ngày trong tuần phải từ 0-6 (0=Chủ nhật)',
      'number.max': 'Ngày trong tuần phải từ 0-6 (0=Chủ nhật)',
      'any.required': 'Ngày trong tuần là bắt buộc cho tần suất weekly'
    }),
    dayOfMonth: Joi.number().min(1).max(31).when('frequency', {
      is: 'monthly',
      then: Joi.required(),
      otherwise: Joi.optional()
    }).messages({
      'number.min': 'Ngày trong tháng phải từ 1-31',
      'number.max': 'Ngày trong tháng phải từ 1-31',
      'any.required': 'Ngày trong tháng là bắt buộc cho tần suất monthly'
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: error.details.map(detail => detail.message)
    });
  }

  // Tạo cron expression từ form data
  try {
    const cronExpression = createCronExpression(
      req.body.frequency,
      req.body.time,
      req.body.dayOfWeek,
      req.body.dayOfMonth
    );
    req.body.cronExpression = cronExpression;
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Không thể tạo biểu thức cron',
      error: error.message
    });
  }

  next();
};

module.exports = {
  validateCreateSchedule,
  validateUpdateSchedule,
  validateScheduleQuery,
  validateCronForm,
  createCronExpression
}; 