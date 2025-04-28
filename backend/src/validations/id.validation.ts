import { Types } from "mongoose";

export const validateId = (id: string) => {
    try {
        return (
            Types.ObjectId.isValid(id) && String(new Types.ObjectId(id)) === id
        );
    } catch (error) {
        return false;
    }
};
