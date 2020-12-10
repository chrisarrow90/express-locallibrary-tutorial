const { body, validationResult } = require('express-validator');
const async = require('async');
const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');
const book = require('../models/book');

// Display list of all BookInstances.
exports.bookinstance_list = (req, res, next) => {
  BookInstance.find()
    .populate('book') // replace book id with a full Book document
    // eslint-disable-next-line camelcase
    .exec((err, list_bookinstances) => {
      if (err) {
        return next(err);
      }
      // Successful, so render
      return res.render('bookinstance_list', {
        title: 'Book Instance List',
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // no results
        const error = new Error('Book Copy not found');
        error.status = 404;
        return next(err);
      }
      // success - render
      return res.render('bookinstance_detail', {
        title: `Copy: ${bookinstance.book.title}`,
        bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, ext) => {
  Book.find({}, 'title').exec((err, books) => {
    if (err) {
      return next(err);
    }
    // Success - render
    res.render('bookinstance_form', { title: 'Create Book Instance', book_list: books });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitise fields.
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
  body('status').escape(),
  body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, 'title').exec((err, books) => {
        if (err) {
          return next(err);
        }
        // Successful, so render.
        return res.render('bookinstance_form', {
          title: 'Create BookInstance',
          book_list: books,
          // eslint-disable-next-line no-underscore-dangle
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance,
        });
      });
      return;
    } else {
      // Data from form is valid.
      bookinstance.save((err) => {
        if (err) {
          return next(err);
        }
        // Successful - redirect to new record.
        res.redirect(bookinstance.url);
      });
    }
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance.findById(req.params.id).exec((err, result) => {
    res.render('bookinstance_delete', {
      title: 'Delete Book Instance',
      bookinstance: result,
    });
  });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  BookInstance.findByIdAndDelete(req.body.bookinstanceid, (err) => {
    if (err) {
      return next(err);
    }
    // Success - go to book instance list
    return res.redirect('/catalog/bookinstances');
  });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
  // Get all books and specific bookinstance for form
  async.parallel(
    {
      bookinstance(callback) {
        BookInstance.findById(req.params.id).populate('book').exec(callback);
      },
      books(callback) {
        Book.find(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.bookinstance == null) {
        // No results
        const error = new Error('Book instance not found');
        error.status = 404;
        return next(error);
      }
      // Success - render book instance form
      res.render('bookinstance_form', {
        title: 'Update Book Instance',
        book_list: results.books,
        // eslint-disable-next-line no-underscore-dangle
        selected_book: results.bookinstance.book._id,
        bookinstance: results.bookinstance,
      });
    },
  );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // Validate and Sanitize
  body('book', 'Book must be specifid').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
  body('status').escape(),
  body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

  // Process request after validisation/sanitisation
  (req, res, next) => {
    // Exract validation errors from request
    const errors = validationResult(req);

    // Create a bookinstance object with escaped/trimmed data and old id
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors so render form again with sanitized values/error messages
      Book.find({}, 'title').exec((err, books) => {
        if (err) {
          return next(err);
        }
        // Success - so render
        res.render('bookinstance_form', {
          title: 'Update Book Instance',
          book_list: books,
          // eslint-disable-next-line no-underscore-dangle
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance,
        });
      });
      return;
    } else {
      // Data from form is valid
      BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, thebookinstance) => {
        if (err) {
          return next(err);
        }
        // success
        res.redirect(thebookinstance.url);
      });
    }
  },
];
