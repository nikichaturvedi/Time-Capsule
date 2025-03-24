const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner } = require("../middleware.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const fetch = require("node-fetch"); 


async function getCoordinates(city) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Geocoding Error:", error);
        return null;
    }
}


router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings }); // Pass listings to the view
}));


router.get("/new", isLoggedIn, (req, res) => {
    res.render("listings/new.ejs");
});


router.get("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
}));


router.post("/", isLoggedIn, upload.single("listing[image]"), wrapAsync(async (req, res) => {
    if (!req.body.listing) {
        throw new ExpressError(400, "Invalid listing data!");
    }

    const { title, description, city, country } = req.body.listing;
    if (!title || !description || !city || !country) {
        throw new ExpressError(400, "Missing required fields!");
    }

   
    const coordinates = await getCoordinates(city);
    if (!coordinates) {
        req.flash("error", "Could not find location coordinates.");
        return res.redirect("/listings/new");
    }

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = req.file ? { url: req.file.path, filename: req.file.filename } : null;
    newListing.geometry = {
        type: "Point",
        coordinates: [coordinates.lon, coordinates.lat], // Store [longitude, latitude]
    };

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
}));


router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
}));


router.put("/:id", isLoggedIn, isOwner, upload.single("listing[image]"), wrapAsync(async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }

   
    if (req.body.listing.city && req.body.listing.city !== listing.city) {
        const coordinates = await getCoordinates(req.body.listing.city);
        if (coordinates) {
            req.body.listing.geometry = {
                type: "Point",
                coordinates: [coordinates.lon, coordinates.lat],
            };
        } else {
            req.flash("error", "Could not update location coordinates.");
            return res.redirect(`/listings/${id}/edit`);
        }
    }

    listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (req.file) {
        listing.image = { url: req.file.path, filename: req.file.filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
}));


router.delete("/:id", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
}));

module.exports = router;

