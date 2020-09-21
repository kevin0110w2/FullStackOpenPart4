const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
  {
    title: 'How to build a car',
    author: 'Elon Musk',
    url: 'www.buildyourcar.com',
    likes: 12
  },
  {
    title: 'Computing for dummies!',
    author: 'Bill Gates',
    url: 'www.computingfordummies.com',
    likes: 5
  },
]

const initialUsers =
{
  username: 'mluukkai',
  name: 'Matti Luukkainen',
  password: 'salainen'
}


const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  // console.log('users in db', users)
  // return users
  return users.map(u => u.toJSON())

}

module.exports = {
  initialBlogs, initialUsers, blogsInDb, usersInDb
}