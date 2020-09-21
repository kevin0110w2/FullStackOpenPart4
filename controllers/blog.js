const blogRouter = require('express').Router()
const { findById } = require('../models/blog')
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

blogRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogRouter.post('/', async (request, response) => {
  //adding new blogs so that when a new blog is created, any user from the database is designated as its creator (for example the one found first).
  // const users = await User.find({})
  // const user = users[0]

  // token-based authentication for blog post creation

  if (!request.token) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const user = await User.findById(decodedToken.id)

  const blog = new Blog({
    ...request.body,
    user: user._id
  })

  try {
    const savedBlog = await blog.save()
    response.json(savedBlog)
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
  } catch (exception) {
    response.status(400).end()
  }
})

blogRouter.delete('/:id', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)
  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  const user = await User.findById(decodedToken.id)
  const aBlog = await Blog.findById(request.params.id)

  if (aBlog.user.toString() === user.id.toString()) {
    await Blog.findByIdAndRemove(request.params.id)
    response.status(204).end()
  }

})

blogRouter.put('/:id', async (request, response) => {
  const body = request.body

  const blog = {
    likes: body.likes
  }

  console.log('likes', body.likes)
  console.log('newblog', blog)

  const blogs = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
  response.json(blogs)
})

module.exports = blogRouter