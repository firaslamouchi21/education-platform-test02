class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, res);
  }

  if (process.env.NODE_ENV === 'production') {
    return sendErrorProd(err, res);
  }
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    // Log error for debugging
    console.error('ERROR 💥:', err);

    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

// Error handler for Firebase Auth errors
const handleFirebaseAuthError = (error) => {
  switch (error.code) {
    case 'auth/invalid-email':
      return new AppError('Invalid email address', 400);
    case 'auth/user-disabled':
      return new AppError('User account has been disabled', 403);
    case 'auth/user-not-found':
      return new AppError('User not found', 404);
    case 'auth/wrong-password':
      return new AppError('Invalid password', 401);
    case 'auth/email-already-in-use':
      return new AppError('Email is already in use', 400);
    case 'auth/operation-not-allowed':
      return new AppError('Operation not allowed', 403);
    case 'auth/weak-password':
      return new AppError('Password is too weak', 400);
    default:
      return new AppError('Authentication error', 401);
  }
};

// Error handler for MySQL errors
const handleMySQLError = (error) => {
  if (error.code === 'ER_DUP_ENTRY') {
    return new AppError('Duplicate entry found', 400);
  }
  if (error.code === 'ER_NO_REFERENCED_ROW') {
    return new AppError('Referenced record not found', 404);
  }
  if (error.code === 'ER_ROW_IS_REFERENCED') {
    return new AppError('Record is referenced by other records', 400);
  }
  return new AppError('Database error', 500);
};

// Error handler for validation errors
const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map(err => err.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

module.exports = {
  AppError,
  handleError,
  handleFirebaseAuthError,
  handleMySQLError,
  handleValidationError
}; 