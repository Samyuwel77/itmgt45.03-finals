const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../util/geocode");
const Journal = require("../models/journal");
const HttpError = require("../models/http-error");

const getEntryById = async (req, res, next) => {
  const entryId = req.params.pid;

  let entry;
  try {
    entry = await Journal.findById(entryId);
  } catch (err) {
    return next(new HttpError("Could not fetch entry.", 500));
  }

  if (!entry) return next(new HttpError("Entry not found.", 404));

  res.json({ entry: entry.toObject({ getters: true }) });
};

const getEntriesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  console.log("Fetching entries for user:", userId); // DEBUG 1

  let entries;
  try {
    entries = await Journal.find({ author: userId });
  } catch (err) {
    return next(
      new HttpError("Fetching entries failed, please try again later.", 500)
    );
  }

  console.log("Database result:", entries); // DEBUG 2

  res.json({
    entries: entries.map((entry) => entry.toObject({ getters: true })),
  });
};

const createEntry = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return next(new HttpError("Invalid inputs.", 422));

  const { headline, journalText, locationName, author } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(locationName);
  } catch (err) {
    return next(err);
  }

  const createdEntry = new Journal({
    headline,
    journalText,
    photo:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpPkm3Hhfm2fa7zZFgK0HQrD8yvwSBmnm_Gw&s",
    locationName,
    coordinates: {
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    },
    author,
  });

  try {
    await createdEntry.save();
  } catch (err) {
    return next(new HttpError("Creating entry failed.", 500));
  }

  res.status(201).json({ entry: createdEntry });
};

const updateEntry = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return next(new HttpError("Invalid inputs.", 422));

  const { headline, journalText } = req.body;
  const entryId = req.params.pid;

  let entry;
  try {
    entry = await Journal.findById(entryId);
  } catch (err) {
    return next(new HttpError("Could not update entry.", 500));
  }

  entry.headline = headline;
  entry.journalText = journalText;

  try {
    await entry.save(); // <— FIXED
  } catch (err) {
    return next(new HttpError("Saving updated entry failed.", 500));
  }

  res.status(200).json({ entry: entry.toObject({ getters: true }) });
};

const deleteEntry = async (req, res, next) => {
  const entryId = req.params.pid;

  let entry;
  try {
    entry = await Journal.findById(entryId);
  } catch (err) {
    return next(new HttpError("Could not delete entry.", 500));
  }

  if (!entry) return next(new HttpError("Entry not found.", 404));

  try {
    await entry.deleteOne(); // <— FIXED
  } catch (err) {
    return next(new HttpError("Deleting entry failed.", 500));
  }

  res.status(200).json({ message: "Entry deleted." });
};

exports.getEntryById = getEntryById;
exports.getEntriesByUserId = getEntriesByUserId;
exports.createEntry = createEntry;
exports.updateEntry = updateEntry;
exports.deleteEntry = deleteEntry;
