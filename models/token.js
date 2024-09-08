const mongoose = require("mongoose");
const { boolean } = require("joi");
const Schema = mongoose.Schema;

const tokenSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: "user",
		unique: true,
	},
	token: { type: String, required: true },
	verified_Email_otp: { type: Boolean },
	password_is_change: { type: Boolean },
	createdAt: { type: Date, default: Date.now, expireAfterSeconds: 7200 },
	expiresAt: { type: Date, expires: 600 }
});

module.exports = mongoose.model("token", tokenSchema);