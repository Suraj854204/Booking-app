const Listing = require("../models/listing");
const sanitize = require("sanitize-html"); // Install this package: npm install sanitize-html

// Helper function to sanitize user input for listing fields
const sanitizeListingInput = (listingData) => {
  const sanitizedData = { ...listingData };
  // Strip all HTML tags from string fields to prevent XSS via stored malicious input
  if (sanitizedData.title) {
    sanitizedData.title = sanitize(sanitizedData.title, {
      allowedTags: [], // No HTML tags allowed
      allowedAttributes: {}
    });
  }
  if (sanitizedData.description) {
    sanitizedData.description = sanitize(sanitizedData.description, {
      allowedTags: [], // No HTML tags allowed
      allowedAttributes: {}
    });
  }
  if (sanitizedData.location) {
    sanitizedData.location = sanitize(sanitizedData.location, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }
  if (sanitizedData.country) {
    sanitizedData.country = sanitize(sanitizedData.country, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }
  // Price is a number, no HTML sanitization needed, assumed to be validated by `validateListing` middleware
  return sanitizedData;
};

// ==============================
// INDEX - Show all listings
// ==============================
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

// ==============================
// NEW - Render new form
// ==============================
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// ==============================
// SHOW - Show single listing
// ==============================
module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate("owner")
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    });

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

// ==============================
// CREATE - Create new listing
// ==============================
module.exports.createListing = async (req, res) => {
  // Sanitize input before creating a new listing to prevent XSS
  const sanitizedListingData = sanitizeListingInput(req.body.listing);
  const newListing = new Listing(sanitizedListingData);
  newListing.owner = req.user._id;

  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  await newListing.save();

  req.flash("success", "New listing created successfully!");
  res.redirect("/listings");
};

// ==============================
// EDIT - Render edit form
// ==============================
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested does not exist!");
    return res.redirect("/listings");
  }

  res.render("listings/edit.ejs", { listing });
};

// ==============================
// UPDATE - Update listing
// ==============================
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;

  // Sanitize input before updating the listing to prevent XSS
  const sanitizedListingData = sanitizeListingInput(req.body.listing);

  const listing = await Listing.findByIdAndUpdate(
    id,
    { ...sanitizedListingData }, // Use sanitized data here
    { new: true }
  );

  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
    await listing.save();
  }

  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${id}`);
};

// ==============================
// DELETE - Delete listing
// ==============================
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);

  req.flash("success", "Listing deleted successfully!");
  res.redirect("/listings");
};