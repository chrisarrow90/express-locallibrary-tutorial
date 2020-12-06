const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const BookSchema = new Schema({
  title: { type: String, required: true },
  // ref option tells mongoose which model to use during population - using the ObjectId of 'Author'
  author: { type: Schema.Types.ObjectId, ref: 'Author', required: true },
  summary: { type: String, required: true },
  isbn: { type: String, required: true },
  // Genre will be an array of ObjectId's since may contain more than one genre
  genre: [{ type: Schema.Types.ObjectId, ref: 'Genre' }],
});

// Virtual for book URL
BookSchema.virtual('url').get(function () {
  return '/catalog/book/' + this._id;
});

// Export Model
module.exports = mongoose.model('Book', BookSchema);
