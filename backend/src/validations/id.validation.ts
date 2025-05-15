import { Types } from "mongoose";

export const validateId = (id: string | Types.ObjectId) => {
    try {
        return (
            Types.ObjectId.isValid(id) && String(new Types.ObjectId(id)) === id
        );
    } catch (error) {
        return false;
    }
};
