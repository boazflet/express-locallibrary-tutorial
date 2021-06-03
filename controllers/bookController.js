var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');
var async = require('async');
const { body,validationResult } = require('express-validator');

exports.index = function(req, res) {
    
    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback); //Pass an empty object as a match conditionto find all documents of this collection
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status: 'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results){
      res.render('index', {title: 'Local Library Home', error: err, data: results});
    
    });
};

//Display list of all Books
exports.book_list = function(req, res, next){
    Book.find({}, 'title author')
        .populate('author')
        .exec(function(err, list_books) {
            if (err) {return next(err);}
            //Success so render
            res.render('book_list', {title: 'Book List', book_list: list_books});
    });
};

//Display detail page for a specific Book
exports.book_detail = function(req, res, next){
    
    async.parallel({
        book: function(callback) {
            
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },
        book_instance: function(callback) {
            
            BookInstance.find({ 'book': req.params.id})
            .exec(callback);
        },
        
    }, function (err, results){
        if (err) { return next(err); }
        if (results==null) { //no results??
            var err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        
        //otherwise successful so render
        res.render('book_detail', { title: 'Book Details - ' + results.book.title, book: results.book, book_instances: results.book_instance });
    });
};


//Display Book create form on GET
exports.book_create_get = function(req, res, next){
    
    //Get all authors and genres, which we can use for adding to our book
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        //otherwise success and render
        res.render('book_form', {title: 'Create New Book', authors: results.authors, genres: results.genres});
    });
};


// Handle book create on POST.
exports.book_create_post = [
    // Convert the genre to an array.
    
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);

        }
        next();
    },

    // Validate fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),
  
    // Sanitize fields (using wildcard has a bug that deletes all but the first element of the genre array).
    //body('*').escape(),
    body('title').escape(),
    body('author').escape(),
    body('summary').escape(),
    body('isbn').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Fix Errors in Create Book', authors:results.authors, genres:results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) { return next(err); }
                   //successful - redirect to new book record.
                   res.redirect(book.url);
                });
        }
    }
];

//Display Book delete form on GET
exports.book_delete_get = function(req, res, next){

        async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).exec(callback)
        },
        books_instances: function(callback) {
            BookInstance.find({'book': req.params.id}).exec(callback)
        },
    }, function(err, results) {
        if (err) {return next(err);}
        if (results.book==null) {
            res.redirect('/catalog/books');
        }
        //Succes so render
        res.render('book_delete', {title: 'Delete Book:', book: results.book, book_instances: results.books_instances});
    });

};


//Handle Book delete on POST
exports.book_delete_post = function(req, res, next){
    
        async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).exec(callback)
        },
        books_instances: function(callback) {
            BookInstance.find({'book': req.params.id}).exec(callback)
        },
    }, function(err, results) {
        if (err) {return next(err);}
        //Book has instances, render as in the GET route
        if (results.books_instances.length > 0 ) {
            res.render('book_delete', {title: 'Can not delete Book while copies of books still listed:', book: results.book, book_instances: results.books_instances});
            return;
        }
        //Book has no instances, delete the Book object and redirect to list of books

        else {
            Book.findByIdAndRemove(results.book.id, function deleteBook(err) {
                if (err) { return next(err); }
                //Otherwise succefully deleted and redirect to Book list
                res.redirect('/catalog/books')
            })
        }
    });

};


//Display Book update form on GET
exports.book_update_get = function(req, res, next){
    //Get book, all authors, all genres for form
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) {return next(err); }
        if (results.book==null) { //No results
            var err = new Error('Book not found.');
            err.status = 404;
            return next(err);
        }
        //otherwise success and render
        //Mark the selected genres as checked
        for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
            for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                if (results.genres[all_g_iter]._id.toString()==results.book.genre[book_g_iter]._id.toString()) {
                    results.genres[all_g_iter].checked='true';
                }
            }
        }
        res.render('book_form', {title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });
    
    });
        
};


//Handle Book update on POST
exports.book_update_post = [
    
    // Convert the genre to an array.
    
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);

        }
        next();
    },

    // Validate fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),
  
    // Sanitize fields (using wildcard has a bug that deletes all but the first element of the genre array).
    //body('*').escape(),
    body('title').escape(),
    body('author').escape(),
    body('summary').escape(),
    body('isbn').escape(),
    body('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre, _id: req.params.id //if there are no genres, create a new array holding the genre object from the POST request and assign the id to the virtual _id, otherwise the DB will assign a new ID, which is an error that you can't catch (logic error)
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Update Book Information', authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Update record.
            Book.findByIdAndUpdate(req.params.id, book, {}, function (err, thebook) {
                if (err) { return next(err); }
                   //successful - redirect to new book record.
                   res.redirect(thebook.url);
                });
        }
    }
];
