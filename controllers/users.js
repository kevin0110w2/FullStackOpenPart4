const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.post('/', async (request, response) => {
  const body = request.body

  const saltRounds = 10

  if (!body.password) {
    return response.status(400).json({ error: 'password missing' })
  }

  const passwordHash = await bcrypt.hash(body.password, saltRounds)

  const user = new User({
    username: body.username,
    name: body.name,
    passwordHash,
  })

  const existingUser = await User.findOne({ username: body.username })

  if (body.password.length < 3) {
    return response.status(400).json({ error: 'password must contain 3 or more characters' })
  } else if (existingUser) {
    return response.status(400).json({ error: 'username must be unique' })
  } else if (!body.username) {
    return response.status(400).json({ error: 'username missing' })
  } else if (body.username.length < 3) {
    return response.status(400).json({ error: 'username must contain 3 or more characters' })
  }
  const savedUser = await user.save()

  response.json(savedUser)
})

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('blogs', { title: 1, author: 1, url: 1 })

  response.json(users)
})

module.exports = usersRouter
