const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const connectDb = require("./config/db");
const routes = require("./routes/route");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");
const { cloudinaryConnect } = require("./cloudinary/cloudinary");
const PORT = process.env.PORT || 3000;
connectDb();
app.use(express.json()); // Parse JSON requests
app.use(
  cors({
    origin: "*",
  })
);
app.use(
  fileUpload({
    useTempFiles: true,
  })
);
cloudinaryConnect();
app.get("/", (req, res) => {
  res.send({
    activeStatus: true,
    error: false,
    message: "API is working fine",
  });
});
app.use("/api/v1", routes);

app.use(express.json({ limit: "50mb" }));
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
