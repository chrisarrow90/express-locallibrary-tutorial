const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const BookInstanceSchema = new Schema (
  {
    book: {type: Schema.Types.ObjectId, ref: 'Book', required: true}, // reference to associated book
    imprint: {type: String, required: true},
    // enum - allowed values of a string
    status: {type: String, required: true, enum: ['Available', 'Maintenance', 'Loanded', 'Reserved'], default: 'Maintenance'},
    due_back: {type: Date, default: Date.now}
  }
);

// Virtual for bookinstance's url
BookInstanceSchema
  .virtual('url')
  .get(function () {
    return '/catolog/bookinstance/' + this._id;
  })

// Export Model
module.exports = mongoose.model('BookInstance', BookInstanceSchema)