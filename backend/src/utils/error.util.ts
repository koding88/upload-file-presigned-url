export interface IError extends Error {
    statusCode?: number;
}

export const errorHandler = (message: string, statusCode: number) => {
    const error = new Error(message) as IError;
    error.statusCode = statusCode;
    error.message = message;
    return error;
};
