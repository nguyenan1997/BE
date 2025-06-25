const Joi = require('joi');

// Registration validation schema
const registrationSchema = Joi.object({
  username: Joi.string()
    .pattern(/^[a-zA-Z0-9_]+$/)
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.pattern.base': 'Username must contain only alphanumeric characters and underscores',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 50 characters',
      'any.required': 'Username is required'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 100 characters',
      'any.required': 'Password is required'
    }),
  
  fullName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name cannot exceed 100 characters',
      'any.required': 'Full name is required'
    })
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Validation functions
const validateRegistration = (data) => {
  const result = registrationSchema.validate(data, { abortEarly: false });
  return result;
};

const validateLogin = (data) => {
  const result = loginSchema.validate(data, { abortEarly: false });
  return result;
};

module.exports = {
  validateRegistration,
  validateLogin
}; 