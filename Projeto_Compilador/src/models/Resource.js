const mongoose = require("mongoose");
const { Schema } = mongoose;

const resourceSchema = new Schema({
  sip: { type: Schema.Types.ObjectId, ref: "SIP", required: true },
  filename: { type: String, required: true },
  checksum: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, required: true },
  public: { type: Boolean, default: false },
  path: { type: String, required: true }, // caminho final no uploads/
});

resourceSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "resource",
  justOne: false,
});

resourceSchema.set("toObject", { virtuals: true });
resourceSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Resource", resourceSchema);
