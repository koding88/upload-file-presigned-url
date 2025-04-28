import { Request, Response, NextFunction } from "express";
import { IError } from "../utils/error.util";
import { HttpStatus } from "../constant/http-status.constant";

export const errorMiddleware = (
    err: IError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        status: "error",
        message: message,
    });
};
