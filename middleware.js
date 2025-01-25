module.exports.isOwner = async (req, res, next) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if (!(listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the owner ");
        return res.redirect(`/listings/${id}`);
    }
next();
};


module.exports.isReviewAuthor = async (req, res, next) => {
    let {id, reviewId} = req.params;
    let review = await Review.findById(reviewId);
    if (!(review.author.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the owner ");
        return res.redirect(`/listings/${id}`);
    }
next();
};



  


   
