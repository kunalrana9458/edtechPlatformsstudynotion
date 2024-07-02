const Tag = require("../models/Tags")

// create Tag handler function

exports.createTag = async(req,res) => {
    try {
        const {name,description} = req.body;

        if(!name || !description) {
            return res.status(400).json({
                success:false,
                message:"All Fields are Required",
            })
        }
        // create entry in Database
        const tagDetails = await Tag.create({
            name:name,
            description:description
        });

        // return response
        return res.status(200).json({
            success:true,
            message:"Tag Created Successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Error Occured during tag creation",
        })
    }
}


// getAll tags handler function
exports.showAllTags = async(req,res) => {
    try {
        const allTags = await Tag.find({},{name:true,description:true});
        return res.status(200).json({
            success:true,
            message:"All Tags returned Successfully",
            allTags,
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Error Occured during tag creation",
        })
    }
}