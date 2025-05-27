const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blacklistSchema = new Schema({
    email: { type: String, require: true, trim: true },
    createdAt: { type: Date, default: Date.now }, // Expire after 2 hours (7200 seconds)
});

module.exports = mongoose.model("Blacklist", blacklistSchema);
