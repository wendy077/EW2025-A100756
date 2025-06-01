const mongoose = require("mongoose");
const { Schema } = mongoose;

const commentSchema = new Schema({
  resource: {
    type: Schema.Types.ObjectId,
    ref: "Resource",
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// sort by date by default:
commentSchema.index({ resource: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", commentSchema);
