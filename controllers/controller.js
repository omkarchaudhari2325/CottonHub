const express = require("express");
// const mongoose = require("mongoose");
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const userDb = require("../models/Data");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const { sendVerificationEmail } = require("../middlewares/sendMail");
const demoHandler = (req, res) => {
  res.json({
    message: "The demo route is working fine",
  });
};

function isFileTypeSupported(type, supportedTypes) {
  return supportedTypes.includes(type);
}

function isLargeFile(fileSize) {
  // converting bytes ito megabytes
  const mbSize = fileSize / (1024 * 1024);
  console.log("filesize is --> ", mbSize);
  return mbSize > 5;
}
async function uploadFileToCloudinary(file, folder, quality) {
  const options = {
    folder: folder,
    resource_type: "auto",
    public_id: file.name,
    use_filename: true,
    unique_filename: false,
  };

  if (quality) {
    options.quality = quality;
  }

  return await cloudinary.uploader.upload(
    file.tempFilePath,
    options,
    function (error, result) {
      console.log(result, error);
    }
  );
}

const uploadHandler = async (req, res) => {
  try {
    const file = req.files.file;
    const prediction = req.body.prediction;
    const token = req.body.token;
    console.log("Token is " + token);
    console.log("Prediction is " + prediction);
    const verifToken = jwt.verify(token, SECRET_KEY);

    const user = await userDb.findOne({ _id: verifToken.id });

    if (!prediction || !file) {
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
      });
    }

    const fileId = file.name.split("_")[0];

    // Check if fileId exists in the imageInfo array
    const imageIds = user.imageInfo.map((image) => image.imageId);
    const imageIdExists = imageIds.includes(fileId);

    if (imageIdExists) {
      return res.status(400).json({
        message: "You already used this image",
        success: false,
      });
    }

    const supportedTypes = ["jpg", "jpeg", "png"];
    const fileType = file.name.split(".")[1].toLowerCase();
    //   console.log("File Type:", fileType);

    if (!isFileTypeSupported(fileType, supportedTypes)) {
      return res.status(400).json({
        success: false,
        message: "File format not supported",
      });
    }

    console.log("Uploading to Cloudinary");
    const response = await uploadFileToCloudinary(file, "cotton_plant");

    user.imageInfo.push({
      diseaseName: prediction,
      imageUrl: response.secure_url,
      imageId: fileId,
    });

    await user.save();

    res.json({
      success: true,
      imageUrl: response.secure_url,
      message: "Data updated successfully and image uploaded successfully",
      file: {
        name: prediction,
        imageUrl: response.secure_url,
        imageId: fileId,
        dateField: Date.now(),
      },
      user: user,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const profilePictureHandler = async (req, res) => {
  try {
    const file = req.files.file;
    const token = req.headers.authorization.split(" ")[1];
    console.log("Token is " + token);
    console.log(file.name);
    const verifToken = jwt.verify(token, SECRET_KEY);

    const user = await userDb.findOne({ _id: verifToken.id });

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
      });
    }

    const supportedTypes = ["jpg", "jpeg", "png"];
    const fileType = file.name.split(".")[1].toLowerCase();

    if (!isFileTypeSupported(fileType, supportedTypes)) {
      return res.status(400).json({
        success: false,
        message: "File format not supported",
      });
    }

    console.log("Uploading to Cloudinary");
    const response = await uploadFileToCloudinary(file, "profile_images");

    user.profileImageUrl = response.secure_url;

    await user.save();

    res.status(200).json({
      success: true,
      profile_image_url: response.secure_url,
      message: "Data updated successfully and image uploaded successfully",
      user: user,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const saveDataHandler = async (req, res) => {
  // console.log(req.body.prediction);

  const { prediction, imageUrl } = req.body;
  console.log(prediction);
  // console.log(imageUrl)

  try {
    if (!prediction) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
      });
    }
    const data = await userDb.create({
      name: prediction,
    });

    res.status(200).json({
      success: true,
      message: data,
    });
  } catch (err) {
    console.log(err);

    res.status(400).json({
      success: false,
      message: "Something error occured",
      error: err,
    });
  }
};

const loginHandler = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).json({
      success: false,
      error: "Please fill all the credentails",
    });
  }

  try {
    const existingUser = await userDb.findOne({ email });
    if (!existingUser) {
      return res.status(422).json({
        success: false,
        error: "The email is not registered yet",
      });
    }
    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid Credentials",
      });
    }

    const token = jwt.sign(
      {
        id: existingUser._id,
        firstName: existingUser.firstName,
        email: existingUser.email,
      },
      process.env.SECRET_KEY,
      {
        expiresIn: "1d",
      }
    );

    res.cookie("token", token, {
      expires: new Date(Date.now() + 9000000),
      httpOnly: true,
    });

    const result = {
      token,
    };

    res.status(201).json({
      success: true,
      result: result,
    });
  } catch (err) {
    console.log(err);
    res.status(401).json({
      success: false,
      message: "User authentication failed",
    });
  }
};

const registerUserHandler = async (req, res) => {
  // console.log(req.body);
  const { firstName, lastName, email, password, confirmPassword, isChecked } =
    req.body;
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return res.status(422).json({
      success: false,
      error: "Please fill all the details",
    });
  }
  try {
    const existingUser = await userDb.findOne({ email: email });

    if (existingUser) {
      return res.status(401).json({
        success: false,
        error: "This email already exists",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userDb.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
    });

    const mail = await sendVerificationEmail(email, firstName);

    res.status(201).json({
      success: true,
      user: user,
      message: "Successfully saved the data",
      //   mail : mail
    });
  } catch (err) {
    console.log(err);

    res.status(401).json({
      success: false,
      message: "Error while saving the data",
    });
  }

  //   res.status(200).json({
  //       success : true,
  //       message : "Data send successfully",
  //   })
};

const validUserHandler = async (req, res) => {
  try {
    const validUser = await userDb.findOne({ _id: req.userId });

    if (!validUser) {
      return res.status(401).json({
        success: false,
        message: "user not found",
      });
    }

    return res.status(201).json({
      success: true,
      user: validUser,
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      success: false,
      message: "unauthorized user",
    });
  }
};
const registerGoogleHandler = async (req, res) => {
  // console.log("inside handler")

  // console.log(req.body);
  // res.send(req.body)
  const { email, given_name, family_name, picture, verified, id } = req.body;
  const user = await userDb.findOne({ email });
  if (!user) {
    const user = await userDb.create({
      email: email,
      firstName: given_name,
      lastName: family_name,
      profileUrl: picture,
    });

    console.log("user saved");
    // console.log(user)
    const token = jwt.sign(
      { email: email, firstName: given_name },
      process.env.SECRET_KEY,
      {
        expiresIn: "1d",
      }
    );

    res.cookie("token", token, {
      expires: new Date(Date.now() + 9000000),
      httpOnly: true,
    });

    const result = {
      token,
    };
    // console.log(token)

    return res.status(201).json({
      result: token,
    });
  }

  if (user) {
    const token = jwt.sign(
      { email: email, firstName: given_name },
      process.env.SECRET_KEY,
      {
        expiresIn: "1d",
      }
    );

    res.cookie("token", token, {
      expires: new Date(Date.now() + 9000000),
      httpOnly: true,
    });

    const result = {
      token,
    };
    // console.log(token)

    return res.status(201).json({
      result: token,
    });
  }

  return res.status(200).json({
    success: true,
    message: "user do not exists",
  });
};

const tokenHandler = async (req, res, next) => {
  const token = req.body.access_token;

  try {
    const response = await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // console.log(response.data);
    const { email, given_name, family_name, picture, id } = response.data;
    const user = await userDb.findOne({ email: response.data.email });
    // console.log(user)
    if (user) {
      const token = jwt.sign(
        { firstName: user.firstName },
        process.env.SECRET_KEY,
        {
          expiresIn: "1d",
        }
      );

      res.cookie("token", token, {
        expires: new Date(Date.now() + 9000000),
        httpOnly: true,
      });

      const result = {
        token,
      };
      // console.log(token)

      return res.status(201).json({
        success: true,

        result: token,
      });
    } else {
      const newUser = await userDb.create({
        email: email,
        firstName: given_name,
        lastName: family_name,
        profileUrl: picture,
      });

      const token = jwt.sign(
        { email: id, firstName: given_name },
        process.env.SECRET_KEY,
        {
          expiresIn: "1d",
        }
      );

      res.cookie("token", token, {
        expires: new Date(Date.now() + 9000000),
        httpOnly: true,
      });

      const result = {
        token,
      };
      // console.log(token)

      return res.status(201).json({
        success: true,
        user: newUser,
        result: token,
      });
    }

    // res.json(response.data); // Send the user info back to the client
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user info" }); // Send an error response to the client
  }
};

const deleteHandler = async (req, res) => {
  const { imageId } = req.params;

  try {
    // Find the user and remove the imageInfo with the provided imageId
    const cloudinaryImageId = await userDb.find({
      "imageInfo.imageId": imageId,
    });
    // console.log(cloudinaryImageId);
    const flattenedIds = cloudinaryImageId.flatMap((item) => item.imageInfo);
    const filteredIds = flattenedIds.filter((info) => info.imageId === imageId);

    const imageUrl = filteredIds[0].imageUrl;
    // console.log(imageUrl);

    const cloudId = imageUrl.split("/");
    // console.log(cl oudId[8].split("_")[0])
    const idToDelete = cloudId[8].split(".")[0];
    console.log(idToDelete);
    const deletedItem = await cloudinary.uploader.destroy(
      `cotton_plant/${idToDelete}.jpg`,
      (err, result) => {
        console.log(result);
      }
    );

    const user = await userDb.findOneAndUpdate(
      { "imageInfo.imageId": imageId },
      { $pull: { imageInfo: { imageId: imageId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Image deleted successfully",
      cloudinary: "image deleted from server",
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateUserHandler = async (req, res) => {
  const { id } = req.params;

  // Validate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log(id);
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  const { firstName, lastName, email } = req.body;

  console.log(firstName, lastName, email);

  if (!firstName || !lastName || !email) {
    return res.status(400).json({
      message: "You cannot leave blank field",
      success: false,
    });
  }

  try {
    const existingUser = await userDb.findById(id);
    if (
      existingUser.firstName === firstName &&
      existingUser.lastName === lastName &&
      existingUser.email === email
    ) {
      return res.status(400).json({
        success: false,
        message: "You must change atleast one field",
      });
    }
    // Update user's information
    const user = await userDb.findOneAndUpdate(
      { _id: id },
      { $set: { firstName, lastName, email } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User information updated successfully",
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const deleteUserHandler = async (req, res) => {
  const { id } = req.params;

  // Validate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log(id);
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  try {
    const validUser = await userDb.findById(id);
    if (!validUser) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const deletedUser = await userDb.findByIdAndDelete(id);
    // await userDb.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const verifyPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    const existingUser = await userDb.findOne({ email });
    if (!existingUser) {
      return res.status(422).json({
        success: false,
        error: "The email is not registered yet",
      });
    }
    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid Credentials",
      });
    }

    return res.status(200).json({
      success: true,
      messaage: "Password Verified",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      messaage: "User not verified ",
    });
  }
};

const changePasswordHandler = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
};

const generateHandler = async (req, res) => {
  const { prompt } = req.body;
  try {
    // For text-only input, use the gemini-pro model

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(text);
    res.send(text);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: false,
    });
  }
};

module.exports = {
  saveDataHandler,
  demoHandler,
  uploadHandler,
  registerUserHandler,
  loginHandler,
  validUserHandler,
  registerGoogleHandler,
  tokenHandler,
  profilePictureHandler,
  deleteHandler,
  updateUserHandler,
  deleteUserHandler,
  verifyPassword,
  changePasswordHandler,
  generateHandler,
};
