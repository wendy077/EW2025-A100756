const mongoose = require("mongoose");
const { Schema } = mongoose;

const newsSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  visible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Atualizar `updatedAt` sempre que houver save()
newsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("News", newsSchema);
