const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  // Handle specific errors with custom messages
  switch (error.name) {
    case "CastError":
      error = {
        statusCode: 400,
        message: "Invalid ID format!",
      };
      break;

    case "JsonWebTokenError":
      error = {
        statusCode: 401,
        message: "Invalid token!",
      };
      break;

    case "TokenExpiredError":
      error = {
        statusCode: 401,
        message: "Token has expired!",
      };
      break;

    case "ValidationError":
      error = {
        statusCode: 400,
        message: Object.values(error.errors)
          .map((value) => value.message)
          .join(", "),
      };
      break;

    case "MongoServerError":
      error = {
        statusCode: err.code,
        message: err.message,
      };
      break;

    case "MongooseError":
      error = {
        statusCode: 400,
        message: err.message,
      };
      break;

    default:
      if (error.message === "jwt malformed") {
        error = {
          statusCode: 401,
          message: "You need to be logged in to perform this action!",
        };
      } else {
        error = {
          statusCode: 500,
          message: "Internal Server Error",
        };
      }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
  });
};

module.exports = errorHandler;
