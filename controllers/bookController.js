const async = require('async');
const { body, validationResult } = require('express-validator');
const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

// Display index page
exports.index = (req, res) => {
  async.parallel(
    {
      book_count(callback) {
        // Pass an empty object as match condition to find all docs of this collection
        Book.countDocuments({}, callback);
      },
      book_instance_count(callback) {
        BookInstance.countDocuments({}, callback);
      },
      book_instance_available_count(callback) {
        BookInstance.countDocuments({ status: 'Available' }, callback);
      },
      author_count(callback) {
        Author.countDocuments({}, callback);
      },
      genre_count(callback) {
        Genre.countDocuments({}, callback);
      },
    },
    (err, results) => {
      res.render('index', { title: 'Local Library Home', error: err, data: results });
    },
  );
};

// Display list of all books.
exports.book_list = (req, res, next) => {
  Book.find({}, 'title author') // returns all book objects, returning only title and author fields
    .populate('author') // replace author id with full author details
    // eslint-disable-next-line camelcase
    .exec((err, list_books) => {
      if (err) {
        return next(err);
      }
      // Successful, so render
      return res.render('book_list', { title: 'Book List', book_list: list_books });
    });
};

// Display detail page for a specific book.
exports.book_detail = (req, res, next) => {
  async.parallel(
    {
      book(callback) {
        Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
      },
      book_instance(callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        // No results
        const error = new Error('Book not found');
        error.status = 404;
        return next(err);
      }
      // Success - render
      return res.render('book_detail', {
        title: 'Title: ',
        book_title: results.book.title,
        book: results.book,
        book_instances: results.book_instance,
      });
    },
  );
};

// Display book create form on GET.
exports.book_create_get = (req, res, next) => {
  // Get all authors and genres which we can use for adding our book
  async.parallel(
    {
      authors(callback) {
        Author.find(callback);
      },
      genres(callback) {
        Genre.find(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      return res.render('book_form', {
        title: 'Create Book',
        authors: results.authors,
        genres: results.genres,
      });
    },
  );
};

// Handle book create on POST.
exports.book_create_post = [
  // Convert Genre to an array
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === 'undefined') req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },

  // Validate and Sanitize fields
  body('title', 'Title must not be empty').trim().isLength({ min: 1 }).escape(),
  body('author', 'Author must not be empty').trim().isLength({ min: 1 }).escape(),
  body('summary', 'Summary must not be empty').trim().isLength({ min: 1 }).escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(), // wildcard * individually validates each of genre array entries

  // Process request after validation and sanitization
  (req, res, next) => {
    // Extract validation errors
    const errors = validationResult(req);

    // Create a book object with escaped and trimmed data
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
      // there are errors. Render form again with sanitiaed values/error messages

      // Get all authors and genres for form
      async.parallel(
        {
          authors(callback) {
            Author.find(callback);
          },
          genres(callback) {
            Genre.find(callback);
          },
        },
        (err, results) => {
          if (err) {
            return next(err);
          }

          // Mark our selected genres as checked (iterate through all genres)
          for (let i = 0; i < results.genre.length; i++) {
            // eslint-disable-next-line no-underscore-dangle
            if (book.genre.indexOf(results.genres[i]._id) > -1) {
              // eslint-disable-next-line no-param-reassign
              results.genres[i].checked = 'true';
            }
          }
          res.render('book_form', {
            title: 'Create Book',
            authors: results.authors,
            genres: results.genres,
            book,
            errors: errors.array(),
          });
        },
      );
      return;
    } else {
      // Data from form is valid. Save book
      book.save((err) => {
        if (err) {
          return next(err);
        }
        // successful - redirect to new book record
        return res.redirect(book.url);
      });
    }
  },
];

// Display book delete form on GET.
exports.book_delete_get = (req, res, next) => {
  async.parallel(
    {
      book(callback) {
        Book.findById(req.params.id).exec(callback);
      },
      book_instances(callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        // no rsults - render list of all books
        res.redirect('/catalog/books');
      }
      // Success - render delete form
      return res.render('book_delete', {
        title: 'Delete Book',
        book: results.book,
        book_instances: results.book_instances,
      });
    },
  );
};

// Handle book delete on POST.
exports.book_delete_post = (req, res, next) => {
  async.parallel(
    {
      book(callback) {
        Book.findById(req.body.bookid).exec(callback);
      },
      book_instances(callback) {
        BookInstance.find({ book: req.body.bookid }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // Success
      if (results.book_instances.length > 0) {
        // Book has instances. Render in same way as for GET route
        res.render('book_delete', {
          title: 'Delete Book',
          book: results.book,
          book_instances: results.book_instances,
        });
      } else {
        // Book has no instances. Delete book and redirect to the list of books
        Book.findByIdAndRemove(req.body.bookid, (error) => {
          if (err) {
            return next(error);
          }
          // Success - go to book list
          return res.redirect('/catalog/books');
        });
      }
    },
  );
};

// Display book update form on GET.
exports.book_update_get = function (req, res) {
  res.send('NOT IMPLEMENTED: Book update GET');
};

// Handle book update on POST.
exports.book_update_post = function (req, res) {
  res.send('NOT IMPLEMENTED: Book update POST');
};
