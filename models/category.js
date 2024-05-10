const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: String,
    category_id:String,
    sub_category: [{
      sub_category_id:String,
      name: String,
      route: String
    }]
  });
  
  const Category = mongoose.model('Category', categorySchema,"Category");
  
  module.exports = Category;