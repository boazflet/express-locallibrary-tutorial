var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
const { body,validationResult } = require('express-validator');

//Display list of all BookInstances
exports.bookinstance_list = function(req, res, next){
    BookInstance.find()
        .populate('book')
        .exec(function(err, list_bookinstances) {
            if (err) {return next(err);}
            //Success so render
            res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list : list_bookinstances});
    });
};

//Display detail page for a specific BookInstance
exports.bookinstance_detail = function(req, res, next){
    
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, bookinstance) {
        if (err) { return next(err) };
        if (bookinstance==null) { //No results
            var err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        //otherwise successful, so render page
        res.render('bookinstance_detail', { title: 'Copy: '+bookinstance.book.title, bookinstance: bookinstance });
    }) 
                  
};


//Display BookInstance create form on GET
exports.bookinstance_create_get = function(req, res, next){
    
    Book.find({}, 'title')
    .exec(function (err, books){
        if (err) {return next(err);}
        //otherwise succesful so render
        res.render('bookinstance_form', {title: 'Create Instance (Copy) of Book', book_list: books});
    });
};


//Handle BookInstance create on POST
exports.bookinstance_create_post = [
    //Validate fields
    body('book', 'Book must be specified').trim().isLength({min: 1}),
    body('imprint', 'Imprint must be specified (Publisher, Year)').trim().isLength({min: 1}),
    body('due_back', 'Invalid return date').optional({ checkFalsy: true}).isISO8601(),
    
    //Sanitize fields
    body('book').escape(),
    body('imprint').escape(),
    body('status').trim().escape(),
    body('due_back').toDate(),
    
    //Process request after val and san
    (req, res, next) => {
        
        //Extract the validation errors from the req
        const errors = validationResult(req);
        
        //Create a BookInstance object with the escaped and trimmed data
        var bookinstance = new BookInstance(
            {book: req.body.book,
             imprint: req.body.imprint,
             status: req.body.status,
             due_back: req.body.due_back                
            });
        
        if (!errors.isEmpty()) {
            //There are errors, render the form again with err messages and sanitized values
            Book.find({}, 'title')
            .exec(function (err, books){
                if (err) {return next(err); }
                //otherwise succesful, and render
                res.render('bookinstance_form', { title: 'Fix Errors in Create New Book Instance', book_list: books, selected_book:bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
            });
            return;
        }
        else {
            //Data from form is valid
            bookinstance.save(function (err) {
                if (err) {return next(err);}
                //save succesful, redirect to new bookinstance
                res.redirect(bookinstance.url);
            });
        }
    }
];


//Display BookInstance delete form on GET
exports.bookinstance_delete_get = function(req, res, next){
    
        BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function(err, bookinstance) {
            if (err) { return next(err) };
            if (bookinstance==null) { //No results
                var err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
        }
        //otherwise successful, so render page
        res.render('bookinstance_delete', {title: 'Delete Book: '+bookinstance.book.title+', Copy: '+bookinstance.book._id, bookinstance: bookinstance});
    });

};


//Handle BookInstance delete on POST
exports.bookinstance_delete_post = function(req, res, next){
    
            
        BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function(err, bookinstance) {
            if (err) { return next(err) };
            if (bookinstance==null) { //No results
                var err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
        }

        //Success so delete book instance

        else {
            BookInstance.findByIdAndRemove(bookinstance.id, function deleteBookinstance(err) {
                if (err) { return next(err); }
                //Otherwise succefully deleted and redirect to Book Instance list
                res.redirect('/catalog/bookinstances')
            })
        }
    });

};


//Display BookInstance update form on GET
exports.bookinstance_update_get = function(req, res, next){
    
        BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function(err, bookinstance) {
            if (err) { return next(err) };
            if (bookinstance==null) { //No results
                var err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
        }
        //otherwise successful, so render page
        res.render('bookinstance_form', {title: 'Update Book: '+bookinstance.book.title+', Copy: '+bookinstance.imprint, bookinstance: bookinstance});
    });

};


//Handle BookInstance update on POST
exports.bookinstance_update_post = [
    //Validate fields
    body('book', 'Book must be specified').trim().isLength({min: 1}),
    body('imprint', 'Imprint must be specified (Publisher, Year)').trim().isLength({min: 1}),
    body('due_back', 'Invalid return date').optional({ checkFalsy: true}).isISO8601(),
    
    //Sanitize fields
    body('book').escape(),
    body('imprint').escape(),
    body('status').trim().escape(),
    body('due_back').toDate(),
    
    //Process request after val and san
    (req, res, next) => {
        
        //Extract the validation errors from the req
        const errors = validationResult(req);
        
        //Create a BookInstance object with the escaped and trimmed data
        var bookinstance = new BookInstance(
            {book: req.body.book,
             imprint: req.body.imprint,
             status: req.body.status,
             due_back: req.body.due_back                
            });
        
        if (!errors.isEmpty()) {
            //There are errors, render the form again with err messages and sanitized values
            Book.find({}, 'title')
            .exec(function (err, books){
                if (err) {return next(err); }
                //otherwise succesful, and render
                res.render('bookinstance_form', { title: 'Fix Errors in Update Book Copy', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
            });
            return;
        }
        else {
            //Data from form is valid
            BookInstance.findByIdAndUpdate(req.params.id, req.body, {}, function (err, the_instance) {
                if (err) { return next(err); }
                   //successful - redirect to new book record.
                   res.redirect(the_instance.url);
                });
        }
    }
];
