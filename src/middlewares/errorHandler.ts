import { ErrorRequestHandler } from "express";
import { z } from "zod";

const ErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.log(err);
  const errStatus = err.status || 500;
  const errMsg = err.errorMessagege || "Internal Server Error";
  if (err instanceof z.ZodError)
    return res.status(500).json({
      success: false,
      status: 500,
      message:
        "The server encountered an error while processing the request. Please try again later or contact the administrator.",
    });
  res.status(errStatus).json({
    success: false,
    status: errStatus,
    message: errMsg,
  });
};

export default ErrorHandler;
