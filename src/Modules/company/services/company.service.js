import { Company } from "../../../DB/models/company.model.js";
import { User } from "../../../DB/models/user.model.js";

export const addCompany = async (req, res) => {
  try {
    const {
      companyName,
      description,
      industry,
      address,
      numberOfEmployees,
      companyEmail,
      createdBy,
    } = req.body;

    // Check if the user exists in the User collection
    const user = await User.findById(createdBy);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if company name or email already exists
    const existingCompany = await Company.findOne({
      $or: [{ companyName }, { companyEmail }],
    });
    if (existingCompany) {
      return res
        .status(400)
        .json({ message: "Company name or email already exists" });
    }

    // Create the company
    const company = await Company.create({
      companyName,
      description,
      industry,
      address,
      numberOfEmployees,
      companyEmail,
      createdBy,
    });

    res.status(201).json({ message: "Company added successfully", company });
  } catch (error) {
    console.log("Error in addCompany:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { companyName, description, industry, address, numberOfEmployees } = req.body;

    // Find the company by ID
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Check if the logged-in user is the company owner or HR
    if (company.createdBy.toString() !== req.loggedInUser._id.toString()) {
      return res.status(403).json({ message: "Only the company owner can update the data" });
    }

    // Update the company data (excluding legalAttachment and createdBy)
    if (companyName) company.companyName = companyName;
    if (description) company.description = description;
    if (industry) company.industry = industry;
    if (address) company.address = address;
    if (numberOfEmployees) company.numberOfEmployees = numberOfEmployees;

    await company.save();

    
    const companyData = company.toObject();
    delete companyData.legalAttachment; 

    res.status(200).json({ message: "Company updated successfully", company: companyData });
  } catch (error) {
    console.log("Error in updateCompany:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


export const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Find the company by ID
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Check if the logged-in user is the company owner or admin
    const isOwner = company.createdBy.toString() === req.loggedInUser._id.toString();
    const isAdmin = req.loggedInUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the company owner or admin can delete the company" });
    }

    // Check if the company is already deleted
    if (company.deletedAt) {
      return res.status(400).json({ message: "Company is already deleted" });
    }

    company.deletedAt = new Date();
    await company.save();

    res.status(200).json({ message: "Company soft deleted successfully" });
  } catch (error) {
    console.log("Error in softDeleteCompany:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getCompanyWithJobs = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Find the company by ID and populate related jobs
    const company = await Company.findById(companyId).populate("jobs");
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Respond with the company and its related jobs
    res.status(200).json({ company });
  } catch (error) {
    console.log("Error in getCompanyWithJobs:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


export const searchCompanyByName = async (req, res) => {
  try {
    const { name } = req.query;

    
    if (!name) {
      return res.status(400).json({ message: "Search query is required" });
    }

    
    const companies = await Company.find({
      companyName: { $regex: name, $options: "i" }, 
      deletedAt: null, 
    });

    res.status(200).json({ companies });
  } catch (error) {
    console.log("Error in searchCompanyByName:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};