import express from 'express';

// import middleware functions here  
import {} from '../middleware'; 

// import controllers here below 
import {userController} from '../controllers/users.controllers'; 

const userRouter = express.Router();

// route definitions below  
userRouter.get('/all', userController); 


export default userRouter;
