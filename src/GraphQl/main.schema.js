import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLList,
} from "graphql";
import { User } from "../DB/models/user.model.js";
import { Company } from "../DB/models/company.model.js";

// Define the User type
const UserType = new GraphQLObjectType({
  name: "User",
  description: "A user in the system",
  fields: () => ({
    _id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    gender: { type: GraphQLString },
    DOB: { type: GraphQLString },
    username: { type: GraphQLString },
  }),
});

// Define the Company type
const CompanyType = new GraphQLObjectType({
  name: "Company",
  description: "A company in the system",
  fields: () => ({
    _id: { type: GraphQLString },
    companyName: { type: GraphQLString },
    description: { type: GraphQLString },
    industry: { type: GraphQLString },
    address: { type: GraphQLString },
    numberOfEmployees: { type: GraphQLString },
    companyEmail: { type: GraphQLString },
    createdBy: { type: UserType }, // Reference to the User type
  }),
});

// Define the main query schema
export const mainSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "mainQuerySchema",
    description: "Main Query Schema",
    fields: {
      listAllUsers: {
        type: new GraphQLList(UserType), // Return a list of users
        description: "List all users",
        resolve: async () => {
          return await User.find(); // Fetch all users from the database
        },
      },
      listAllCompanies: {
        type: new GraphQLList(CompanyType), // Return a list of companies
        description: "List all companies",
        resolve: async () => {
          return await Company.find().populate("createdBy"); // Fetch all companies and populate createdBy
        },
      },
    },
  }),
});