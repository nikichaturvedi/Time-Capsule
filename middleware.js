const Listing = require("./models/listing");
const Review = require("./models/reviews");

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



module.exports.isOwner = async (req, res, next) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if (!(listing.owner.equals(res.locals.currUser._id) || res.locals.currUser._id.toString() === '671715a689cf6b5a798d8593')) {
        req.flash("error", "You are not the owner ");
        return res.redirect(`/listings/${id}`);
    }
next();
};


module.exports.isReviewAuthor = async (req, res, next) => {
    let {id, reviewId} = req.params;
    let review = await Review.findById(reviewId);
    if (!(review.author.equals(res.locals.currUser._id) || res.locals.currUser._id.toString() === '671715a689cf6b5a798d8593')) {
        req.flash("error", "You are not the owner ");
        return res.redirect(`/listings/${id}`);
    }
next();
};



   
