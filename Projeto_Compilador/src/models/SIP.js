const mongoose = require('mongoose');
const { Schema } = mongoose;

const sipSchema = new Schema({
  version:  { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  originalFilename: String,  // nome do zip
});

module.exports = mongoose.model('SIP', sipSchema);
