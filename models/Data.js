const mongoose = require("mongoose");
const {sendVerificationEmail} = require("../middlewares/sendMail")
const userSchema = new mongoose.Schema({
  firstName : {
    type: String,
    required: true,
    trim : true,
  },
  lastName : {
    type : String,
    required : true,
    trim : true,
  },
  email : {
    type : String,
    required : true,
  },
  profileUrl : {
    type : String,
  },
  password : {
    type : String,
    // required : true,
  },
  profileImageUrl : {
    type : String,
  },
  imageInfo : [
    {
      diseaseName : {
        type : String,
      },
      imageUrl : {
        type : String,
      },
      imageId : {
        type : String,
      },
      dateField : {
        type : Date,
        default : Date.now,
      }
    }
  ],
  dateField : {
    type: Date,
    default: Date.now(),
  },
});


// userSchema.pre("save" ,async function(next){
//   await sendVerificationEmail(this.email,this.firstName);
//   next();
// })

const userDb = new mongoose.model("Users", userSchema);
module.exports = userDb;
