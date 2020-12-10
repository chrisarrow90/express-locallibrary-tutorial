const async = require('async');
const { body, validationResult } = require('express-validator');
const Genre = require('../models/genre');
const Book = require('../models/book');

// Display list of all Genre.
exports.genre_list = (req, res, next) => {
  Genre.find()
    .sort([['name', 'ascending']])
    // eslint-disable-next-line camelcase
    .exec((err, list_genres) => {
      if (err) {
        return next(err);
      }
      // Successful, so render
      return res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        // extract ID from URL params and use to get current genre
        Genre.findById(req.params.id).exec(callback);
      },

      genre_books(callback) {
        // use genre ID to get all book objects that have that id in their genre field
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // no results
        const error = new Error('Genre not found');
        error.status = 404;
        return next(error);
      }
      // Successful so render
      return res.render('genre_detail', {
        title: 'Genre Detail',
        genre: results.genre,
        genre_books: results.genre_books,
      });
    },
  );
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and santise the name field.
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors - render form again with sanitized values/error messages
      res.render('genre_form', { title: 'Create Genre', genre, errors: errors.array() });
      return;
    } else {
      // Data from form is valid
      // Check if Genre with same name already exists
      Genre.findOne({ name: req.body.name }).exec(function (err, found_genre) {
        if (err) {
          return next(err);
        }

        if (found_genre) {
          // Genre Exists, redirect to its detail page
          res.redirect(found_genre.url);
        } else {
          genre.save(function (err) {
            if (err) {
              return next(err);
            }
            // Genre saved. Redirect to genre detail page
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // no results - render list of genres
        res.redirect('/catalog/genres');
      }
      // Success - render delete form
      return res.render('genre_delete', {
        title: 'Delete Genre',
        genre: results.genre,
        genre_books: results.genre_books,
      });
    },
  );
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.body.genreid).exec(callback);
      },
      genre_books(callback) {
        Book.find({ genre: req.body.genreid }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // Success
      if (results.genre_books.length > 0) {
        // Genre has books. Render same as GET route to remind user to delete books
        res.render('genre_delete', {
          title: 'Delete Genre',
          genre: results.genre,
          genre_books: results.genre_books,
        });
        return;
      } else {
        // Genre has no books. Delete object and return to genre list
        Genre.findByIdAndRemove(req.body.genreid, (err) => {
          if (err) {
            return next(err);
          }
          // Success - go to genre list
          res.redirect('/catalog/genres');
        });
      }
    },
  );
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res, next) => {
  // Get Genre for form
  Genre.findById(req.params.id, (err, genre) => {
    if (err) {
      return next(err);
    }
    if (genre == null) {
      // No results
      const error = new Error('Genre not found');
      error.status = 404;
      return next(err);
    }
    res.render('genre_form', { title: 'Update Genre', genre });
  });
};

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate and Sanitise name field
  body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

  (req, res, next) => {
    const errors = validationResult(req);

    // Create a genre object with escapped/trimmed data and old id
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors -so render form again with sanitised value/errors
      res.render('genre_form', { title: 'Update Genre', genre, errors: errors.array() });
    } else {
      // Data from form is valid. update form
      // Check if Genre with same name already exists
      // eslint-disable-next-line camelcase
      Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
        if (err) {
          return next(err);
        }
        // eslint-disable-next-line camelcase
        if (found_genre) {
          // Genre already exists. Redirect to its detail page
          res.redirect(found_genre.url);
        } else {
          // eslint-disable-next-line camelcase
          Genre.findByIdAndUpdate(req.params.id, genre, {}, (error, updated_genre) => {
            if (error) {
              return next(error);
            }
            // Success - redirect to genre detail page
            res.redirect(updated_genre.url);
          });
        }
      });
    }
  },
];
