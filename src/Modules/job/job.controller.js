// auth controller
import { Router } from 'express'
import * as jobServices from '../job/services/job.service.js'
import { errorHandler } from '../../Middleware/error-handling.middleware.js';
import { authenticationMiddleware } from '../../Middleware/auth.middleware.js';



const jobController = Router();

jobController.post('/add-job' , authenticationMiddleware() ,errorHandler(jobServices.addJobOpportunity))
jobController.put('/update-job/:jobId' , authenticationMiddleware() ,errorHandler(jobServices.updateJobOpportunity))
jobController.delete('/delete-job/:jobId' , authenticationMiddleware() ,errorHandler(jobServices.deleteJobOpportunity))

export default jobController;