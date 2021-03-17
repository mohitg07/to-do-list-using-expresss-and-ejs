// important NOTE - our all ejs files must be in folder named "views" and views folder must be at same hierarchical level as app.js

const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();


// in order to use template, I have to install ejs-module
// this line is important if I want to use template
// Anything that is valid in html document, all will be applicable in ejs file too
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

// I have pushed all my static files to the public folder and defined here using express
app.use(express.static("public"));

// connecting mongoose with mongoDB cluster which is giving me the service of database to store database
// you can create your account at https://www.mongodb.com/cloud/atlas
mongoose.connect('mongodb+srv://<put your username here>:<put your password here>@cluster0.otbtt.mongodb.net/<put your database name here>', {useNewUrlParser: true, useUnifiedTopology: true});

// in mongoose, everything is derived from a schema so firstly I am making schema here
const itemsSchema = new mongoose.Schema({
  name: String
});

// now compiling our itemsSchema into a model
// here we have to mention singular form of our collection that's why I have written "Item" just
// mongoose will automatically conver this collection into plural form i.e. items
const Item = mongoose.model('Item', itemsSchema);

// now I am creating 3 Item documents
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

// make array of all the Item documents that I have taken by default
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]  //establishing relationship between 2 collections
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req,res){

 // by using empty curly brackets here, it means that I want to find all my documents in database having "Item" collection
  Item.find({}, function(err, foundItems){

    // it means we have not saved any data in database yet
    if(foundItems.length === 0){

      // here I am inserting data to my "Item" collection
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully saved deafult items to database");
        }
      });

      res.redirect("/");
    }else{
      // my ejs file name is "list" and the variable used in that ejs file is "kindOfDay"
      // so I have to use the same names here in below line of code
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

// here we are using EJS routing parameters to create dynamic url's on go
// whatever name is specified in the url by user that will be stored in variable named "customList"
app.get("/:customListName", function(req, res){

  // due to lodash module, I become able to use capitalize() function
  // this function basically Converts the first character of string to upper case and the remaining to lower case.
  const customList = _.capitalize(req.params.customListName);

 // now I have to check in my "List" collection whether I found any list with name="customList" or not
 List.findOne({name: customList}, function(err, foundList){
   if(!err){
     if(!foundList){
       // create a new list
       const list = new List({
         name: customList,
         items: defaultItems
       });

       list.save();
       // now I want to redirect user to the specified route after a gap of 2 sec
       setTimeout(() => { res.redirect('/' + customList);}, 2000);
     }else{
       // show an existing list
       res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
     }
   }
 });

});

app.post("/", function(req, res){
  // whatever list item is written by user that will be stored in itemName variable
  const itemName = req.body.newItem;

  // whatever we have specified in "value" attribute in button, that will be obtained by us if we hit req.body.name
  const listName = req.body.list;

  // creating new document for the item which is entered by user
  const newItem = new Item({
    name: itemName
  });

  if(listName === "Today"){
    newItem.save();  // with this, newItem gets saved to my database

    // now after this, i will redirect user to my home route
    res.redirect("/");
  }else{
    // now find relevant list from "List" collection
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName); // now redirect user to the custom url
    });
  }
});


app.post("/delete", function(req, res){
  // it will return id of the selected item
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
    });
  }else{
    // findOneAndUpdate() - Finds a matching document, updates it according to the update arg, and returns the found document (if any) to the callback.
    // here in case of update function, I have used $pull operator

    // The $pull operator removes from an existing array all instances of a value or values that match a specified condition
    // here I want to remove that item from "items" array which is having _id same as checkedItemId
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    })
  }

});

app.listen(process.env.PORT || 3000, function(){
  console.log("server is running at 3000");
})
