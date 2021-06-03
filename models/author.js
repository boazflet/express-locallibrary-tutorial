var mongoose = require('mongoose');
var moment = require('moment');

var Schema = mongoose.Schema;

var AuthorSchema = new Schema(
  {
    first_name: {type: String, required: true, maxlength: 100},
    family_name: {type: String, required: true, maxlength: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
    book_count: {type: Number}
  }
);

// Virtual for author's full name
AuthorSchema
.virtual('name')
.get(function () {

// To avoid errors in cases where an author does not have either a family name or first name
// We want to make sure we handle the exception by returning an empty string for that case

  var fullname = '';
  if (this.first_name && this.family_name) {
    fullname = this.family_name + ', ' + this.first_name
  }
  if (!this.first_name || !this.family_name) {
    fullname = '';
  }

  return fullname;
});

// Virtual for author's lifespan
AuthorSchema
.virtual('lifespan')
.get(function () {
    if (this.date_of_death!=null) {
        return (this.date_of_death.getYear() - this.date_of_birth.getYear()).toString();
    }
    else if (this.date_of_birth==null){
        return 'Unknown';
    }
    else {
        var today = new Date();
        return (today.getFullYear() - this.date_of_birth.getFullYear()).toString();
    }
      
});

// Virtual for author's URL
AuthorSchema
.virtual('url')
.get(function () {
  return '/catalog/author/' + this._id;
});

//Virtual for DOB format
AuthorSchema
.virtual('date_of_birth_formatted')
.get(function () {
    return this.date_of_birth ? moment(this.date_of_birth).format('DD MMMM YYYY') : '?';
});

//Virtual for DOD format
AuthorSchema
.virtual('date_of_death_formatted')
.get(function () {
    return this.date_of_death ? moment(this.date_of_death).format('DD MMMM YYYY') : '?';
});
//Virtual for DOB format
AuthorSchema
.virtual('date_of_birth_formatted_date_picker')
.get(function () {
    return this.date_of_birth ? moment(this.date_of_birth).format('YYYY-MM-DD') : '?';
});

//Virtual for DOD format
AuthorSchema
.virtual('date_of_death_formatted_date_picker')
.get(function () {
    return this.date_of_death ? moment(this.date_of_death).format('YYYY-MM-DD') : '?';
});

//Export model
module.exports = mongoose.model('Author', AuthorSchema);