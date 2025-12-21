const mongoose = require('mongoose');

const customCommandSchema = new mongoose.Schema({
  guildID: { type: String, required: true },
  command: { type: String, required: true },
  type: { type: String, default: 'text' }, // text, image, embed
  response: String,
  imageUrl: String,
  embedTitle: String,
  embedColor: String,
  embedFooter: String,
  embedThumbnail: String
});


customCommandSchema.index({ guildID: 1, command: 1 }, { unique: true });

module.exports = mongoose.model('CustomCommand', customCommandSchema);
