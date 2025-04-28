import Joi from "joi";

export const productValidation = Joi.object({
    name: Joi.string().min(3).required().messages({
        "string.empty": "Name is required",
        "string.min": "Name must be at least 3 characters long",
        "any.required": "Name is required",
        "string.base": "Name must be a string",
    }),
});
