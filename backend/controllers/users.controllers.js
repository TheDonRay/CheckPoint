import { User } from "../models/users.mongoSchema.js";

// GET /users - list all users
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        return res.json(users);
    } catch (error) {
        return res.status(500).json({ 
            Error: error
        }); 
    }
};

export { getAllUsers };
