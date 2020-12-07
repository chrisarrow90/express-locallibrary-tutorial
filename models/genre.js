const mongoose = require('mongoose');

const { Schema } = mongoose;

const GenreSchema = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100,
  },
});

// Virtual for Genre's URL
GenreSchema.virtual('url').get(function () {
  return `/catalog/genre/${this._id}`; // eslint-disable-line no-underscore-dangle
});

// Export Model
module.exports = mongoose.model('Genre', GenreSchema);
