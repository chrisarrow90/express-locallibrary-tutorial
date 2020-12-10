const async = require('async');
const { body, validationResult } = require('express-validator');
const Author = require('../models/author');
const Book = require('../models/book');

// Display list of all authors
exports.author_list = (req, res, next) => {
  Author.find()
    .sort([['family_name', 'ascending']])
    // eslint-disable-next-line camelcase
    .exec((err, list_authors) => {
      if (err) {
        return next(err);
      }
      // Successful, so render
      return res.render('author_list', { title: 'Author List', author_list: list_authors });
    });
};

// Display detail page for a specific author
exports.author_detail = (req, res, next) => {
  async.parallel(
    {
      author(callback) {
        Author.findById(req.params.id).exec(callback);
      },
      authors_books(callback) {
        Book.find({ author: req.params.id }, 'title summary').exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err); // error in API
      }
      if (results.author == null) {
        const error = new Error('Author not found'); // no results
        error.status = 404;
        return next(error);
      }
      // Success - render
      return res.render('author_detail', {
        title: 'Author Detail',
        author: results.author,
        author_books: results.authors_books,
      });
    },
  );
};

// Display Author create form on GET
exports.author_create_get = (req, res, next) => {
  res.render('author_form', { title: 'Create Author' });
};

// Handle Author create on POST
exports.author_create_post = [
  // Validate and Sanitize fields
  body('first_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('First name must be specified.')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters.'),
  body('family_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Family name must be specified.')
    .isAlphanumeric()
    .withMessage('Last name has non-alphanumeric characters.'),
  body('date_of_birth', 'Invalid date of birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body('date_of_death', 'Invalid date of death')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitisation
  (req, res, next) => {
    // Extract validation errors from request
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. render form again with sanitized values/error messages
      res.render('author_form', {
        title: 'Create Author',
        author: req.body,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid
      // Create an Author object with escaped and trimmed data
      const author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
      });
      author.save(function (err) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to new author record
        res.redirect(author.url);
      });
    }
  },
];

// Display Author delete form on GET
// get id of Author to be deleted, get the author record and all associated books.
// then render the author_delete view.
exports.author_delete_get = (req, res, next) => {
  async.parallel(
    {
      author(callback) {
        Author.findById(req.params.id).exec(callback);
      },
      authors_books(callback) {
        Book.find({ author: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.author == null) {
        // no results - render list of all authors
        res.redirect('/catalog/authors');
      }
      // Success - render delete form
      return res.render('author_delete', {
        title: 'Delete Author',
        author: results.author,
        author_books: results.authors_books,
      });
    },
  );
};

// Handle Author Delete on POST
// validate id has been provided. then get author and associated books
// if no books - then delete author object and redirect to list of authors
// if books - re-render form, pass the author and list of books to be deleted
exports.author_delete_post = (req, res, next) => {
  async.parallel(
    {
      author(callback) {
        Author.findById(req.body.authorid).exec(callback);
      },
      authors_books(callback) {
        Book.find({ author: req.body.authorid }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // Success
      if (results.authors_books.length > 0) {
        // Author has books. Render in same way as for GET route.
        res.render('author_delete', {
          title: 'Delete Author',
          author: results.author,
          author_books: results.authors_books,
        });
        return;
      } else {
        // Author has no books. Delete object and redirect to the list of authors.
        Author.findByIdAndRemove(req.body.authorid, (err) => {
          if (err) {
            return next(err);
          }
          // Success - go to author list
          res.redirect('/catalog/authors');
        });
      }
    },
  );
};

// Display Author update form on GET
exports.author_update_get = function (req, res) {
  req.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update on POST
exports.author_update_post = function (req, res) {
  res.send('NOT IMPLEMENTED: Author update POST');
};
