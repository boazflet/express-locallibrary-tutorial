var Author = require('../models/author');
var Book = require('../models/book');
var async = require('async');
const { body,validationResult } = require('express-validator');

//Display list of all Authors
exports.author_list = function(req, res, next){
    
    Author.find()
        .populate('author')
        .sort([['family_name', 'ascending']])
        .exec(function (err, list_authors){
        if (err) { return next(err); }
        //Success so render
        //Count how many titles per author and add to render
        /*for (var i=0; i < list_authors.length; i++){
            book_count: countFunction(callback) {
                Book.countDocuments({author: list_authors[i]._id}, callback);
            }, errFunction(err, results) {
                if (err) {return next(err); }
                list_authors[i].book_count = results;
            }
            
        }*/
        res.render('author_list', {title: 'Author List', author_list: list_authors})
    });
};

//Display detail page for a specific author
exports.author_detail = function(req, res, next){
    
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
                .exec(callback)
        },
        authors_books: function(callback) {
            Book.find({ 'author': req.params.id}, 'title summary')
            .exec(callback)
        },
        
    }, function(err, results) {
        if (err) { return next(err); }//Error in API usage
        if (results.author==null) { //No results for author
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
    }
    //otherwise succesful, render page
    res.render( 'author_detail', {title: 'Author Detail - ' + results.author.name, author: results.author, author_books: results.authors_books} );
    });
};


//Display Author create form on GET
exports.author_create_get = function(req, res, next){
    res.render('author_form', { title: 'Create Author' });
};


//Handle Author create on POST
exports.author_create_post = [ //it's an array bc we do several functions, not just 1
    
    //Validate fields
    body('first_name').isLength({min: 1}).trim().withMessage('First name must be specified').isAlphanumeric().withMessage('First name has non-alphanumeric characters'),
    body('family_name').isLength({min: 1}).trim().withMessage('Family name must be specified').isAlphanumeric().withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth', 'Invalid Date of Birth').optional({checkFalsy: true}).isISO8601(), //date is optional, but must conform to ISO 8601 format
    body('date_of_death', 'Invalid Date of Death').optional({checkFalsy: true}).isISO8601(), // comma because the following f'ns still part of the array
    
    
    //Sanitize fields
    body('first_name').escape(),
    body('family_name').escape(),
    body('date_of_birth').toDate(),
    body('date_of_death').toDate(),
    
    
    //Process request after val/san
    (req, res, next) => {
        
        //Extract any validation errors from the req
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            
            //There are errors, render again with sanitized values + error messages
            res.render('author_form', { title: 'Correct Errors In Author Creation', author: req.body, errors: errors.array() });
            return;            
        }
        //We are allowing duplicate authors so we don't use findInstanceOf()
        else {
            //Data form is valid, create new Author object with trimmed and escaped values
            var author = new Author(
                { //commas and colons bc this is an object passed inside {}
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                
            });
            author.save(function (err) {
                if (err) { return next(err); }
                //or succesful and redirect to new author page
                res.redirect(author.url);
            });
        }
    }
];


//Display Author delete form on GET
exports.author_delete_get = function(req, res, next){
    
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: function(callback) {
            Book.find({'author': req.params.id}).exec(callback)
        },
    }, function(err, results) {
        if (err) {return next(err);}
        if (results.author==null) {
            res.redirect('/catalog/authors');
        }
        //Succes so render
        res.render('author_delete', {title: 'Delete Author:', author: results.author, author_books: results.authors_books});
    });
};


//Handle Author delete on POST
exports.author_delete_post = function(req, res, next){
    
    async.parallel({
        author: function(callback) {
            Author.findById(req.body.authorid).exec(callback)
        },
        authors_books: function(callback) {
            Book.find({'author': req.body.authorid}).exec(callback)
        },
    }, function(err, results) {
        if (err) {return next(err);}
        //Author has books, render as in the GET route
        if (results.authors_books.length > 0 ) {
            res.render('author_delete', {title: 'Can not delete Author while books still listed:', author: results.author, author_books: results.authors_books});
            return;
        }
        //Author has no books, delete the Author object and redirect to list of authors

        else {
            Author.findByIdAndRemove(author.id, function deleteAuthor(err) {
                if (err) { return next(err); }
                //Otherwise succefully deleted and redirect to Author list
                res.redirect('/catalog/authors')
            })
        }
    });
};


//Display Author update form on GET
exports.author_update_get = function(req, res, next){
    
    //Get Author and books info
    Author.findById(req.params.id).exec(function(err, author) {
        if (err) { return next(err); }
        //Success so render
        res.render('author_form', {title: 'Update Author Information', author: author});
        
    }); 
};


//Handle Author update on POST
exports.author_update_post = [ //it's an array bc we do several functions, not just 1
    
    //Validate fields
    body('first_name').isLength({min: 1}).trim().withMessage('First name must be specified').isAlphanumeric().withMessage('First name has non-alphanumeric characters'),
    body('family_name').isLength({min: 1}).trim().withMessage('Family name must be specified').isAlphanumeric().withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth', 'Invalid Date of Birth').optional({checkFalsy: true}).isISO8601(), //date is optional, but must conform to ISO 8601 format
    body('date_of_death', 'Invalid Date of Death').optional({checkFalsy: true}).isISO8601(), // comma because the following f'ns still part of the array
    
    
    //Sanitize fields
    body('first_name').escape(),
    body('family_name').escape(),
    body('date_of_birth').toDate(),
    body('date_of_death').toDate(),
    
    
    //Process request after val/san
    (req, res, next) => {
        
        //Extract any validation errors from the req
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            
            //There are errors, render again with sanitized values + error messages
            res.render('author_form', { title: 'Correct Errors In Author Update', author: req.body, errors: errors.array() });
            return;            
        }
        
        else {
            // Data from form is valid. Update record.
            Author.findByIdAndUpdate(req.params.id, req.body, {}, function (err, theauthor) {
                if (err) { return next(err); }
                   //successful - redirect to new book record.
                   res.redirect(theauthor.url);
                });
        }
    }
];
