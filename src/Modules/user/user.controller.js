// user controller
import { Router } from 'express'
import  * as profileService  from './Services/profile.service.js';
import { errorHandler } from './../../Middleware/error-handling.middleware.js';
import { authenticationMiddleware } from '../../Middleware/auth.middleware.js';
import { isAdmin } from './../../Middleware/admin.middleware.js';

const userController = Router();

userController.get('/profile' , authenticationMiddleware(),errorHandler(profileService.getProfile))
userController.put("/:userId/assign-admin", authenticationMiddleware(), isAdmin, profileService.assignAdminRole);
userController.put('/update-profile' , errorHandler(profileService.updateUserAccount))
userController.patch('/update-password' , authenticationMiddleware() ,errorHandler(profileService.updatePasswordService))
userController.delete('/delete-user' , authenticationMiddleware() ,errorHandler(profileService.updatePasswordService))



export default userController;