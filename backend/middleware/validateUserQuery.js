import { User } from "../models/users.mongoSchema.js";

// Pulled from the schema so the allowed values can never drift out of sync. 
// we include these values here to make sure that we are expecting values that are whitelisted. 
const ROLES = User.schema.path("role").enumValues;
const STATUSES = User.schema.path("status").enumValues;

const MAX_LIMIT = 100;

// Validates and normalises the query string for GET /users.
// Rejects bad input with a 400; otherwise attaches req.listQuery and moves on.
const validateUserQuery = (req, res, next) => {
    const { role, status, page = "1", limit = "20" } = req.query;

    const filter = {};

    if (role !== undefined) {
        if (!ROLES.includes(role)) {
            return res.status(400).json({
                error: `Invalid role '${role}'. Expected one of: ${ROLES.join(", ")}`,
            });
        }
        filter.role = role;
    }

    if (status !== undefined) {
        if (!STATUSES.includes(status)) {
            return res.status(400).json({
                error: `Invalid status '${status}'. Expected one of: ${STATUSES.join(", ")}`,
            });
        }
        filter.status = status;
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);

    if (!Number.isInteger(pageNum) || pageNum < 1) {
        return res.status(400).json({ error: "page must be a positive integer" });
    }

    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > MAX_LIMIT) {
        return res.status(400).json({
            error: `limit must be an integer between 1 and ${MAX_LIMIT}`,
        });
    }

    // req.query is read-only in Express 5, so hang the result off a new property.
    req.listQuery = {
        filter,
        page: pageNum,
        limit: limitNum,
        skip: (pageNum - 1) * limitNum,
    };

    next();
};

export { validateUserQuery };
