const mongoose = require("mongoose");
const connectDB = async () =>{
    try{
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("database connected successfully");
    }
    catch(err){
        console.log(err);
        process.exit(1);
    }
}
module.exports = connectDB;

