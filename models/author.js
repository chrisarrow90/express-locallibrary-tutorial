const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const { Schema } = mongoose;

const AuthorSchema = new Schema({
  first_name: { type: String, required: true, maxlength: 100 },
  family_name: { type: String, required: true, maxlength: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

// Virtual for Author's full name
AuthorSchema.virtual('name').get(function () {
  return `${this.family_name}, ${this.first_name}`;
});

// Virtual for Author's life span
AuthorSchema.virtual('lifespan').get(function () {
  return (this.date_of_death.getYear() - this.date_of_death.getYear()).toString();
});

// Virtual for Author's URL
AuthorSchema.virtual('url').get(function () {
  return `/catalog/author/${this._id}`; // eslint-disable-line no-underscore-dangle
});

// Virtuals for Date Formatting
AuthorSchema.virtual('date_of_birth_formatted').get(function dobFormatted() {
  return this.date_of_birth
    ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED)
    : '';
});

AuthorSchema.virtual('date_of_death_formatted').get(function dodFormatted() {
  return this.date_of_death
    ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)
    : '';
});

// Export model (Compile Schema into a Model and export - mongoose.model(modelName, schema)
module.exports = mongoose.model('Author', AuthorSchema);
