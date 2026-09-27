import express from 'express';

// import middleware functions here
import { validateUserQuery } from '../middleware/validateUserQuery.js';

// import controllers here below
import { getAllUsers } from '../controllers/users.controllers.js';

const userRouter = express.Router();

// route definitions below
userRouter.get('/users', validateUserQuery, getAllUsers);

export default userRouter;
