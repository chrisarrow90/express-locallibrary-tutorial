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
  let lifetime_string = '';
  if (this.date_of_birth) {
    lifetime_string = DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED);
  }
  lifetime_string += ' - ';
  if (this.date_of_death) {
    lifetime_string += DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED);
  }
  return lifetime_string;
});

// Virtual for Author's URL
AuthorSchema.virtual('url').get(function () {
  return `/catalog/author/${this._id}`; // eslint-disable-line no-underscore-dangle
});

// Virtuals for Date Formatting YYYY-MM-DD
AuthorSchema.virtual('date_of_birth_yyyy_mm_dd').get(function dobFormatted() {
  return DateTime.fromJSDate(this.date_of_birth).toISODate();
});

AuthorSchema.virtual('date_of_death_yyyy_mm_dd').get(function dodFormatted() {
  return DateTime.fromJSDate(this.date_of_death).toISODate();
});

// Export model (Compile Schema into a Model and export - mongoose.model(modelName, schema)
module.exports = mongoose.model('Author', AuthorSchema);
