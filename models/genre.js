const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const GenreSchema = new Schema(
  {
    name: {type: String, required: true, minlength: 3, maxlength: 100},
  }
)

// Virtual for Genre's URL
GenreSchema
  .virtual('url')
  .get(function () {
    return '/catology/genre/' + this._id;
  })

// Export Model
module.exports = mongoose.export('Genre', GenreSchema);