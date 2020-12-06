const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AuthorSchema = new Schema(
  {
    first_name: {type: String, required: true, maxlength: 100},
    last_name: {type: String, required: true, maxlength: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date}
  }
)

// Virtual for Author's full name
AuthorSchema
  .virtual('name')
  .get(function () {
    return this.family_name + ', ' + this.first_name;
  })

// Virtual for Author's life span
AuthorSchema
  .virtual('lifespan')
  .get(function () {
    return (this.date_of_death.getYear() - this.date_of_death.getYear()).toString();
  })

// Virtual for Author's URL
AuthorSchema
  .virtual('url')
  .get(function () {
    return '/catolog/author/' + this._id;
  })

// Export model (Compile Schema into a Model and export - mongoose.model(modelName, schema)
module.exports = mongoose.model('Author', AuthorSchema);