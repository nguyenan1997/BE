const Joi = require('joi');

// User update validation schema
const userUpdateSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .optional()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 50 characters'
    }),
  
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  
  fullName: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name cannot exceed 100 characters'
    }),
  
  role: Joi.string()
    .valid('user', 'admin')
    .optional()
    .messages({
      'any.only': 'Role must be either "user" or "admin"'
    }),
  
  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be a boolean value'
    })
});

// Password update schema
const passwordUpdateSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  
  newPassword: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'New password must be at least 6 characters long',
      'string.max': 'New password cannot exceed 100 characters',
      'any.required': 'New password is required'
    })
});

// Validation functions
const validateUserUpdate = (data) => {
  return userUpdateSchema.validate(data, { abortEarly: false });
};

const validatePasswordUpdate = (data) => {
  return passwordUpdateSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateUserUpdate,
  validatePasswordUpdate
}; 