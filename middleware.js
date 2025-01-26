const Listing = require("./models/listing");
const Review = require("./models/reviews");
const mongoose = require('mongoose');


module.exports.isLoggedIn = (req, res, next) =>{
    if (!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "you must be logged in ");
        return res.redirect("/login");
    }
    next();
};


module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};



 // Import mongoose for ObjectId handling

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);

    // Ensure the listing exists
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    // Convert your Atlas user ID to an ObjectId instance (or handle it as a string if needed)
    const atlasUserId = new mongoose.Types.ObjectId('679511aa791af0b79422abb3'); // Example Atlas user ID

    // Check if the current user is the owner or has the specific Atlas admin user ID
    if (!(listing.owner.equals(res.locals.currUser._id) || res.locals.currUser._id.equals(atlasUserId))) {
        req.flash("error", "You are not the owner");
        return res.redirect(`/listings/${id}`);
    }

    next();
};



module.exports.isReviewAuthor = async (req, res, next) => {
    let {id, reviewId} = req.params;
    let review = await Review.findById(reviewId);
    if (!(review.author.equals(res.locals.currUser._id) || res.locals.currUser._id.toString() === '679511aa791af0b79422abb3')) {
        req.flash("error", "You are not the owner ");
        return res.redirect(`/listings/${id}`);
    }
next();
};


  


   
