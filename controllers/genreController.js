var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
//var mongoose = require('mongoose');
const { body,validationResult } = require('express-validator');

//Display list of all Genres
exports.genre_list = function(req, res, next){
    Genre.find()
        .populate('genre')
        .sort([['name', 'ascending']])
        .exec(function (err, list_genres) {
            if (err) {return next(err);}
            //Success so render
            res.render('genre_list', {title: 'Genre List', genre_list: list_genres});
    });
};

//Display detail page for a specific Genre
exports.genre_detail = function(req, res, next){
    
    //var id = mongoose.Types.ObjectId(req.params.id);
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
            //Genre.findById(id)
            .exec(callback);
        },
        
        genre_books: function(callback) {
            Book.find( {'genre': req.params.id} )
            //Book.find( {'genre': id} )
            .exec(callback);
        },
    
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) {//No results found
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        //Success so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    
    });
};


//Display Genre create form on GET
exports.genre_create_get = function(req, res, next){
    res.render('genre_form', { title: 'Create Genre' });
};


//Handle Genre create on POST
exports.genre_create_post = [
    //Validate that the name field is not empty
    body('name', 'Genre name can not be empty or less than 3 characters').trim().isLength({ min: 3 }),
    
    //Sanitize ("escape") the name field
    body('name').escape(),
    
    //Process request after val/san
    (req, res, next) => {
        
        //Extract the validation errors from the req
        const errors = validationResult(req);
        
        //Create a genre object with escaped and trimmed data
        /*The reason this is being done here is that some of the data might
        be alright and we use it populate fields when the form is returned*/
        var genre = new Genre(
            {name: req.body.name}
        );
        
        if (!errors.isEmpty()) { //There are errors, render the form again with sanitized values/ err messages
            res.render('genre_form', { title: 'Repeat Create Genre', genre: genre, errors: errors.array()});
            return;
        }
        else { 
            //Data from form is valid
            //Ensure genre does not already exist
            Genre.findOne({ 'name': req.body.name })
                .exec( function(err, exists_genre) {
                    if (err) { return next(err); }

                    if (exists_genre) {//genre exists, rerdirect to its detail page
                        res.redirect(exists_genre.url);
                    }
                    else {

                        genre.save( function (err) {
                            if (err) { return next(err); }
                            //Genre succesfully saved, redirect to detail page
                            res.redirect(genre.url);
                    });
                }
            });
        }
    }    
];


//Display Genre delete form on GET
exports.genre_delete_get = function(req, res, next){
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback)
        },
        genres_books: function(callback) {
            Book.find({'genre': req.params.id}).exec(callback)
        },
    }, function(err, results) {
        if (err) {return next(err);}
        if (results.genre==null) {
            res.redirect('/catalog/genres');
        }
        //Succes so render
        res.render('genre_delete', {title: 'Delete Genre:', genre: results.genre, genre_books: results.genres_books});
    });
};


//Handle Genre delete on POST
exports.genre_delete_post = function(req, res, next){
    
        async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.genreid).exec(callback)
        },
        genres_books: function(callback) {
            Book.find({'author': req.body.genreid}).exec(callback)
        },
    }, function(err, results) {
        if (err) {return next(err);}
        //Genre has books, render as in the GET route
        if (results.genres_books.length > 0 ) {
            res.render('genre_delete', {title: 'Can not delete Genre while books still listed:', genre: results.genre, genre_books: results.genres_books});
            return;
        }
        //Genre has no books, delete the Genre object and redirect to list of genres

        else {
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if (err) { return next(err); }
                //Otherwise succefully deleted and redirect to Author list
                res.redirect('/catalog/genres')
            })
        }
    });

};


//Display Genre update form on GET
exports.genre_update_get = function(req, res, next){
    
    Genre.findById(req.params.id).exec(function(err, genre) {
        if (err) {return next(err); }
        //Success so render
        res.render('genre_form', { title: 'Update Genre Name', genre: genre });
        
    });
};


//Handle Genre update on POST
exports.genre_update_post = [
    //Validate that the name field is not empty
    body('name', 'Genre name can not be empty or less than 3 characters').trim().isLength({ min: 3 }),
    
    //Sanitize ("escape") the name field
    body('name').escape(),
    
    //Process request after val/san
    (req, res, next) => {
        
        //Extract the validation errors from the req
        const errors = validationResult(req);
        
        //Create a genre object with escaped and trimmed data
        /*The reason this is being done here is that some of the data might
        be alright and we use it populate fields when the form is returned*/
        var genre = new Genre(
            {name: req.body.name}
        );
        
        if (!errors.isEmpty()) { //There are errors, render the form again with the old genre name/ err messages
            Genre.findById(req.params.id).exec(function(err, old_genre) {
               if (err) { return next(err); }
                res.render('genre_form', { title: 'Fix Errors in Genre Update', genre: old_genre, errors: errors.array()});
            return;
            });
            
        }
        else {
            // Data from form is valid. Update record.
            Genre.findByIdAndUpdate(req.params.id, req.body, {}, function (err, thegenre) {
                if (err) { return next(err); }
                   //successful - redirect to new book record.
                   res.redirect(thegenre.url);
                });
        }
    }    
];
