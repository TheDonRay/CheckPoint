import { User } from "../models/users.mongoSchema.js";

// GET /users - list all users
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        next(error);
    }
};

export { getAllUsers };
