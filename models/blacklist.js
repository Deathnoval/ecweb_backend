const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blacklistSchema = new Schema({
    email: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 7200 }, // Expire after 2 hours (7200 seconds)
});

module.exports = mongoose.model("Blacklist", blacklistSchema);
