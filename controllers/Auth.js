const User = require("../models/User.model");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const Profile = require("../models/Profile");
const jwt = require("jsonwebtoken");
require("dotenv").config();
// sendOtp
exports.sendOTP = async (req, res) => {
  try {
    // fetch email from req body
    const { email } = req.body;
    // check if user already exist
    const checkUserPresent = await User.findOne({ email });
    // if user already exist
    if (checkUserPresent) {
      return res.json({
        success: false,
        message: "User Already Registerd",
      });
    }
    // generate otp
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log("Generated OTP:", otp);
    // check unique otp or not
    const result = await OTP.findOne({ otp: otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }

    const otpPayload = { email, otp };
    // create an entry in DB for otp
    const otpBody = await OTP.create(otpPayload);
    console.log(otpBody);
    // return response
    res.status(200).json({
      success: true,
      message: "OTP e Sucessfully",
      otp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// signup
exports.signUp = async (req, res) => {
  try {
    // data fetched from req body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;
    // validate the data
    if (!firstName || !lastName || !password || !confirmPassword || !otp) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }
    // password and confirm password check
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password is not same",
      });
    }
    // check user already exist or not
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({
        success: false,
        message: "User Already Exist",
      });
    }
    // find most recent OTP Stored for the user
    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(-1);
    console.log(recentOtp);
    // validate otp
    if (recentOtp.length === 0) {
      // otp not exist
      return res.status(400).json({
        success: false,
        message: "OTP not Found",
      });
    } else if (otp !== recentOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }
    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // create entry into the DB
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });
    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });
    // return the response
    return res.status(200).json({
      success: true,
      message: "User Created Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      meesage: "User Not created, Please Try Again!",
    });
  }
};

// login
exports.logIn = async (req, res) => {
  try {
    // fetch the data
    const { email, password } = req.body;
    // validation of Data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "Fill All The Details",
      });
    }
    // check user exist in the Database or not
    const userExist = User.findOne({ email }).populate("additionalDetails");
    if (!userExist) {
      return res.status(400).json({
        success: false,
        message: "User Doesn't Exist",
      });
    }
    // check password and DB bcrypt password
    if (await bcrypt.compare(password, userExist.password)) {
      // generate JWT token
      const payload = {
        email: userExist.email,
        id: userExist._id,
        accountType: userExist.accountType,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      userExist.token = token;
      userExist.password = undefined;

      // pass JWT Token in a cookie and marked password as undefined
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        userExist,
        message: "Logged in Successfully",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Password is Incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Login Failure, Please try again",
    });
  }
};

// change Password
exports.changePassword = async(req,res) => {
    // fetch data from the req body
    // get olderPassword , new Password, confirm Password
    // validation
    // update password in DB
    // send mail : password updated
    // return response
}