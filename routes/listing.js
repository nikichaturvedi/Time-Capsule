const express =  require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const {isLoggedIn , isOwner} = require("../middleware.js");
const multer = require("multer");
const  {storage} = require("../cloudConfig.js");
const upload = multer({storage});

//Index route
router.get("/", wrapAsync(async(req,res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs" ,{allListings});
})
);


//New route
router.get("/new",
    isLoggedIn,
    (req, res) =>{
    res.render("listings/new.ejs");
});


// Show route
router.get("/:id", wrapAsync(async(req, res) =>{
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate({
        path:"reviews" ,
        populate:{
            path: "author",
        },
    })
    .populate("owner");
    if(!listing){
      req.flash("error", "Listing you requested for does not exist! ")  ;
      res.redirect("/listings");
    }
    res.render("listings/show.ejs", {listing});
})
);


//Create route
router.post("/",  
    isLoggedIn,
    upload.single("listing[image]"),
    wrapAsync(async(req, res, next)=>{

   if(!req.body.listing){
    throw new ExpressError(400, "Send valid data for listing");
   }
     // let {title, description, image, price, location,country} = req.body.listing;
     const newListing = new Listing(req.body.listing);
     if (!newListing.title){
        throw new ExpressError(400, "title is missing"); 
     }
     if (!newListing.description){
        throw new ExpressError(400, "description is missing"); 
     }
     if (!newListing.location){
        throw new ExpressError(400, "location is missing"); 
     }
     if (!newListing.country){
        throw new ExpressError(400, "country is missing"); 
     }
    //  const newListing = new Listing(req.body.listing);
     
     let url = req.file.path;
     let filename = req.file.filename;

    //  const newListing = new Listing(req.body.listing);
     newListing.owner = req.user._id;
     newListing.image = {url, filename};
     await newListing.save();
     req.flash("success", "New Listing Created!");
     res.redirect("/listings");
   
})
);


//Edit route
router.get("/:id/edit",
    isLoggedIn,
    isOwner,
     wrapAsync(async (req, res) =>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "Listing you requested for does not exist! ")  ;
        res.redirect("/listings");
      }

      res.render("listings/edit.ejs", {listing});
})
);


//Update route
router.put("/:id",
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    wrapAsync(async(req, res) =>{
    let {id} = req.params;
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});

    if(typeof req.file !== "undefined"){
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = {url, filename};
    await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
}));


//Delete route
router.delete("/:id" ,
    isLoggedIn,
    isOwner,
     wrapAsync(async(req, res) =>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
}));


module.exports = router;