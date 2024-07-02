const Course = require("../models/Course");
const Tag = require("../models/Tags")
const User = require("../models/User.model");
const {uploadImageToCloudinary} = require("../utils/imageUploader")
require("dotenv").config();

// create course handler function
exports.createCourse = async(req,res) => {
    try {
        // fetch data 
        const {courseName,courseDescription,whatYouWillLearn,price,tag} = req.body;
        // extract or fetch file (req.file path)
        const thumbnail = req.files.thumbnailImage;
        // validation
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail){
            return res.status(400).json({
                success:false,
                message:"All Fields are Mandatory",
            });
        }
        // instructor validation check given user is instructor or not and instructor id into the Course Schema
        const userId = req.user.id;
        const instructorDetails = await User.find(userId);
        console.log(instructorDetails);

        if(!instructorDetails){
            return res.status(404).json({
                success:false,
                message:"Instructor Details Not Found",
            });
        }
        // check tag given by instructor is valid or invalid
        const tagDetails = await Tag.findById(tag);
        if(!tagDetails){
            return res.status(404).json({
                success:false,
                message:"Tag Details not found"
            });
       }
        // upload image to the cloudinary -> cloudinary gives a secure url for image
        const thumbnailImage = await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME)
        // create an new course entry in the DB
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor:instructorDetails._id,
            whatYouWillLearn:whatYouWillLearn,
            price:price,
            tag:tagDetails._id,
            thumbnail:thumbnailImage.secure_url,
        })
        // add course entry into the user Schema
        await User.findByIdAndUpdate({_id:instructorDetails._id},
            {
                $push:{
                    courses:newCourse._id,
                }
            },
            {new:true},
        )
        // add course entry into the tag Schema -> Homeword
        return res.status(200).json({
            success:true,
            message:"Course Created Successfully",
            data:newCourse
        })
    } catch (error) {
        console.log("Course Creation Error:",error);
        return res.status(500).json({
            success:false,
            message:"Failed to create New Course",
            error:error.message,
        })   
    }
}

// get all courses handler

exports.showAllCourses = async(req,res) => {
    try {
        const allCourses = await Course.find({},{
            courseName:true,
            price:true,
            thumbnail:true,
            instructor:true,
            ratingAndReviews:true,
            studentEnrolled:true,
        }).populate("instructor")
          .exec();

        return res.status(200).json({
            success:true,
            message:"All Courses Fetched Successfully",
            data:allCourses,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"cannot fetch Course Data",
            error:error.message,
        })
    }
}