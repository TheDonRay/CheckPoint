import { User } from "../models/users.mongoSchema.js";

// GET /users - list users, filtered and paginated by validateUserQuery
const getAllUsers = async (req, res, next) => {
    try {
        const { filter, page, limit, skip } = req.listQuery;

        const [users, total] = await Promise.all([
            User.find(filter).skip(skip).limit(limit),
            User.countDocuments(filter),
        ]);

        res.json({ page, limit, total, users });
    } catch (error) {
        next(error);
    }
};

export { getAllUsers };
