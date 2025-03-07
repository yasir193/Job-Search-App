// auth controller
import { Router } from 'express'
import * as authServices from '../Auth/services/authentication.service.js'
import { errorHandler } from '../../Middleware/error-handling.middleware.js';
// import { authenticationMiddleware } from '../../Middleware/auth.middleware.js';
const authController = Router();

authController.post('/signup' ,  errorHandler(authServices.signUpService))
authController.put('/confirm-email' , errorHandler(authServices.ConfirmEmailService))
authController.post('/signin' , errorHandler(authServices.signInService))
authController.post('/gmail-login' , errorHandler(authServices.GmailLoginService) )
authController.post('/gmail-signup' , errorHandler(authServices.GmailRegistrationService))
authController.post('/forgot-password' , errorHandler(authServices.forgotPasswordService))
authController.post('/reset-password' , errorHandler(authServices.resetPasswordService))



export default authController;