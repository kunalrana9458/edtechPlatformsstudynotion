const User = require("../models/User.model");
const mailSender = require("../utils/mailSend");
const bcrypt = require("bcrypt")

// reset passwordToken
exports.resetPasswordToken = async (req, res) => {
  try {
    // get email from req body
    const { email } = req.body;
    // check user for this email , email validation
    const userExist = await User.findOne({ email });
    if (!userExist) {
      return res.json({
        success: false,
        message: "User Doesn't Exist",
      });
    }
    // generate token
    const token = crypto.randomUUID();
    // update user by adding token and expiration time
    const updatedDetails = await User.findByIdAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 5 * 60 * 1000,
      },
      { new: true }
    );
    // create url
    const url = `http://localhost:3000/update-password/${token}`;
    // send mail containing the url
    await mailSender(
      email,
      "Password Reset Link",
      `Password Reset Link:${url}`
    );
    return res.json({
      success: true,
      message:
        "Email Sent Successfully, please check email and change Password",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
        success:false,
        message:"Something went wrong while Reset Password",
    })
  }
};

// reset password
exports.resetPassword = async(req,res) => {
    try {
            // data fetch
    const {password,confirmPassword,token} = req.body;
    // validation 
    if(password !== confirmPassword) {
        return res.json({
            success:false,
            message:"Password not matching",
        })
    }
    // get userdetails from DB using token
    const userDetails = await User.findOne({token:token});
    // if no entry -> invalid token
    if(!userDetails){
        return res.json({
            success:false,
            message:"Token is Invalid"
        })
    }
    // token time check
    if(userDetails.resetPasswordExpires < Date.now()){
        return res.json({
            success:false,
            message:"Token Expires",
        })
    }
    // hash password
    const hashedPassword = await bcrypt.hash(password,10);
    // insert new password into the database
    await User.findOneAndUpdate({
        token:token
    },{password:hashedPassword},{new:true});
    return res.json({
        success:true,
        message:"Password Updated successfully",
    })
    } catch (error) {
        console.log("Error in Reset Password:",error);
        return res.json({
            success:false,
            message:"Error during reset the password",
        })
    }
}