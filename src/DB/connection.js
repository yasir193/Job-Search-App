// database connection
import mongoose from "mongoose";


export const database_connection = async () =>{
  try {
    await mongoose.connect(process.env.DB_URI)
    console.log('database connected') 
  } catch (error) {
    console.log(error)
  }
}