const express = require("express");

const router = express.Router();
const {
  saveDataHandler,
  demoHandler,
  uploadHandler,
  registerUserHandler,
  loginHandler,
  validUserHandler,
  registerGoogleHandler,
  tokenHandler,
  deleteHandler,
  profilePictureHandler,
  updateUserHandler,
  deleteUserHandler,
  verifyPassword,
  changePasswordHandler,
  generateHandler
} = require("../controllers/controller");

const {
  authenticate,
  googleLoginVerifier,
  authenticate2
} = require("../middlewares/verifier");

router.get("/get-token", authenticate2, (req, res) => {
  console.log("Inside getToken: " + req.token);

  // Send response with JSON data
  return res.status(200).json({
    message: "Auth completed",
    token: req.token,
    user : req.user,
    success : true
  });
});

router.post("/login", loginHandler);
router.delete("/deleteImage/:imageId", deleteHandler);
router.get("/googleLoginVerifier", googleLoginVerifier);
router.post("/getToken", tokenHandler);
router.get("/validUser", authenticate, validUserHandler);
router.post("/registerUser", registerUserHandler);
router.post("/imageUpload", uploadHandler);
router.post("/profilePicture", profilePictureHandler);
router.post("/sendData", saveDataHandler);
router.get("/demo", demoHandler);
router.post("/registerGoogle", registerGoogleHandler);
router.post("/update-user/:id",updateUserHandler)
router.post("/delete-user/:id",deleteUserHandler)
router.post("/verify-password",verifyPassword);
router.post("/change-password",changePasswordHandler);
router.post("/generate",generateHandler)

module.exports = router;
