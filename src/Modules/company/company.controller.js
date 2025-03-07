// auth controller
import { Router } from 'express'
import * as companyServices from '../company/services/company.service.js'
import { errorHandler } from '../../Middleware/error-handling.middleware.js';
import { authenticationMiddleware } from '../../Middleware/auth.middleware.js';



const companyController = Router();

companyController.post('/add-company' ,  errorHandler(companyServices.addCompany))
companyController.get('/get-company/:companyId' ,  authenticationMiddleware() ,errorHandler(companyServices.getCompanyWithJobs))
companyController.get('/search?'  ,errorHandler(companyServices.searchCompanyByName))
companyController.put('/update-company/:companyId' ,  authenticationMiddleware() ,errorHandler(companyServices.updateCompany))
companyController.delete('/delete-company/:companyId' ,  authenticationMiddleware() ,errorHandler(companyServices.deleteCompany))




export default companyController;