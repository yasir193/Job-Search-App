import { JobOpportunity } from "../../../DB/models/job-opportunity.model.js";
import { Company } from "../../../DB/models/company.model.js";
import mongoose from "mongoose";

export const addJobOpportunity = async (req, res) => {
  try {
    const {
      jobTitle,
      jobLocation,
      workingTime,
      seniorityLevel,
      jobDescription,
      technicalSkills,
      softSkills,
      companyId,
    } = req.body;

    const userId = req.loggedInUser._id; 

    
    if (
      !jobTitle ||
      !jobLocation ||
      !workingTime ||
      !seniorityLevel ||
      !jobDescription ||
      !technicalSkills ||
      !softSkills ||
      !companyId
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Check if the logged-in user is the company owner
    if (company.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the company owner can add jobs" });
    }

    // Create the job opportunity
    const job = await JobOpportunity.create({
      jobTitle,
      jobLocation,
      workingTime,
      seniorityLevel,
      jobDescription,
      technicalSkills,
      softSkills,
      addedBy: userId,
      companyId,
    });

    res.status(201).json({ message: "Job added successfully", job });
  } catch (error) {
    console.log("Error in addJobOpportunity:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


export const updateJobOpportunity = async (req, res) => {
  try {
    const { jobId } = req.params; 
    const userId = req.loggedInUser._id; 
    const updateFields = req.body; 

    // Find job by ID
    const job = await JobOpportunity.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job opportunity not found" });
    }

    // Find company associated with the job
    const company = await Company.findById(job.companyId);
    if (!company) {
      return res.status(404).json({ message: "Associated company not found" });
    }

    
    if (company.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the company owner can update jobs" });
    }

    
    const updatedJob = await JobOpportunity.findByIdAndUpdate(jobId, updateFields, {
      new: true, 
      runValidators: true, 
    });

    res.status(200).json({ message: "Job updated successfully", job: updatedJob });
  } catch (error) {
    console.error("Error in updateJobOpportunity:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


export const deleteJobOpportunity = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.loggedInUser._id;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid job ID format" });
    }

    const job = await JobOpportunity.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job opportunity not found" });
    }

    const company = await Company.findById(job.companyId);
    if (!company) {
      return res.status(404).json({ message: "Associated company not found" });
    }

    if (company.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the company owner can delete jobs" });
    }

    await JobOpportunity.findByIdAndDelete(jobId);

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error in deleteJobOpportunity:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};