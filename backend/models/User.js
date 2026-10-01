const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    college: {
      type: String,
      default: ""
    },

    branch: {
      type: String,
      default: ""
    },

    year: {
      type: String,
      default: ""
    },

    graduationYear: {
      type: String,
      default: ""
    },

    targetRole: {
      type: String,
      default: ""
    },

    preparationType: {
      type: String,
      default: ""
    },

    currentLevel: {
      type: String,
      default: ""
    },

    dailyGoal: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);