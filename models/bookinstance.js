var mongoose = require('mongoose');
var moment = require('moment');

var Schema = mongoose.Schema;

var BookInstanceSchema = new Schema(
  {
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true }, //reference to the associated book
    imprint: {type: String, required: true},
    status: {type: String, required: true, enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'], default: 'Maintenance'},
    due_back: {type: Date, default: Date.now}
  }
);

// Virtual for bookinstance's URL
BookInstanceSchema
.virtual('url')
.get(function () {
  return '/catalog/bookinstance/' + this._id;
})
// Virtual property for date format
BookInstanceSchema
.virtual('due_back_formatted')
.get(function() {
    return moment(this.due_back).format('MMMM Do, YYYY');
})
// Virtual property for date pickers
BookInstanceSchema
.virtual('due_back_formatted_date_picker')
.get(function() {
    return moment(this.due_back).format('YYYY-MM-DD');
})
//Virtual property for date-time format
BookInstanceSchema
.virtual('due_back_d_t_formatted')
.get(function() {
    return moment(this.due_back).format('h A, DD MMM YYYY')
});


//Export model
module.exports = mongoose.model('BookInstance', BookInstanceSchema);