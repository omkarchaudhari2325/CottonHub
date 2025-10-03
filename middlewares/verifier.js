const jwt = require("jsonwebtoken")
const userDb = require("../models/Data");
const SECRET_KEY = process.env.SECRET_KEY;
const authenticate = async(req,res,next) =>{
    try{
        const token = req.headers.authorization;
        const verifToken = jwt.verify(token,SECRET_KEY);

        const user = await userDb.findOne({email:verifToken.email});
        console.log(user);
        if(!user){
            return res.status(401).json({
                success : false,
                error : "User not found"
            })
        };

        req.token = token;
        req.user = user;
        req.userId = user._id;

        next();

    }
    catch(err){
        console.log(err);
        return res.status(401).json({
            success : false,
            message : "Falied to verify the user"
        })
    }
}
const authenticate2 = async(req,res,next) =>{
    try{
        console.log(req.headers)
        const token = req.headers.authorization.split(' ')[1];
  // const token = "demo";
        // console.log('Token received at backend:', token);
    // res.json({ message: 'Token received at backend' , token })
        const verifToken = jwt.verify(token,SECRET_KEY);

        const user = await userDb.findOne({email:verifToken.email});
        // console.log(user);
        if(!user){
            return res.status(401).json({
                success : false,
                error : "User not found"
            })
        };

        req.token = token;
        req.user = user;
        req.userId = user._id;

        next();

    }
    catch(err){
        console.log(err);
        return res.status(401).json({
            success : false,
            message : "Falied to verify the user"
        })
    }
}
const googleLoginVerifier = async (req,res) =>{
    try{
      const token = req.headers.authorization;
      console.log(token)
      const verifToken = jwt.verify(token,SECRET_KEY);
      console.log(verifToken)

      const user = await userDb.findOne({email:verifToken.email});
      console.log(user);
      if(!user){
          return res.status(401).json({
              success : false,
              error : "User not found"
          })
      };
      res.status({
        user : user,
        success : true,
        message : "Found the user"
      })

      // req.token = token;
      // req.user = user;
      // req.userId = user._id;


  }
  catch(err){
      console.log(err);
      return res.status(401).json({
          success : false,
          message : "Falied to verify the user"
      })
  }
  }

module.exports = {
    authenticate,
    googleLoginVerifier,
    authenticate2
}
