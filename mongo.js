const config = require('./utils/config')
const mongoose = require('mongoose')

if (process.argv.length<3 ) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]

mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const blogSchema = new mongoose.Schema({
    title: String,
    author: String,
    url: String,
    likes: Number
  })
  
  blogSchema.set('toJSON', {
    transform: (document, returnedObject) => {
      returnedObject.id = returnedObject._id.toString()
      delete returnedObject.__v
    }
  })

const Blog = mongoose.model('Blog', blogSchema)

const blog = new Blog ({
    title: "LO",
    author: "CK",
    url: "ww.ogle.co.uk",
    likes: 12
})

blog.save().then(response => {
  console.log('note saved!');
  mongoose.connection.close();
})


// Note.find({}).then(result => {
//   result.forEach(note => {
//     console.log(note)
//   })
//   mongoose.connection.close()
// })