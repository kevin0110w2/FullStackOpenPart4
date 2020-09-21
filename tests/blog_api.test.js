const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const bcrypt = require('bcrypt')
const User = require('../models/user')

describe('blog tests', () => {
  describe('get blogs testing', () => {
    beforeEach(async () => {
      await Blog.deleteMany({})

      const blogObjects = helper.initialBlogs
        .map(blog => new Blog(blog))
      const promiseArray = blogObjects.map(blog => blog.save())
      await Promise.all(promiseArray)

      await User.deleteMany({})

      await api
        .post('/api/users')
        .send(helper.initialUsers)
      // const userObjects = helper.initialUsers
      //   .map(user => new User(user))
      // const promiseArrayTwo = userObjects.map(user => user.save())
      // await Promise.all(promiseArrayTwo)
    })
    test('blogs are returned as json', async () => {
      await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    test('all blogs are returned', async () => {
      const response = await api.get('/api/blogs')

      expect(response.body).toHaveLength(helper.initialBlogs.length)
    })

    test('a specific blog is within the returned blogs', async () => {
      const response = await api.get('/api/blogs')

      const titles = response.body.map(r => r.title)

      expect(titles).toContain(
        'Computing for dummies!'
      )
    })

    test('blogs posts have a unique identifier property named id', async () => {
      const blogs = await Blog.find({})

      expect(blogs[0].id).toBeDefined()
    })
  })

  describe('adding blogs', () => {
    beforeEach(async () => {
      await Blog.deleteMany({})

      const blogObjects = helper.initialBlogs
        .map(blog => new Blog(blog))
      const promiseArray = blogObjects.map(blog => blog.save())
      await Promise.all(promiseArray)

      await User.deleteMany({})

      await api
        .post('/api/users')
        .send(helper.initialUsers)
      // const userObjects = helper.initialUsers
      //   .map(user => new User(user))
      // const promiseArrayTwo = userObjects.map(user => user.save())
      // await Promise.all(promiseArrayTwo)
    })
    test('a valid blog can be added', async () => {
      const newBlog = {
        title: 'async/await simplifies making async calls',
        author: 'Full Stack Open 2020',
        url: 'https://fullstackopen.com/en/part4/testing_the_backend',
        likes: 5
      }

      const users = await helper.initialUsers

      const token = await api
        .post('/api/login')
        .send(users)

      await api
        .post('/api/blogs')
        .set('Authorization', `bearer ${token.body.token}`)
        .send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

      const titles = blogsAtEnd.map(r => r.title)
      expect(titles).toContain(
        'async/await simplifies making async calls'
      )
    })

    test('blog cannot be added without authentication token', async () => {
      const newBlog = {
        title: 'async/await simplifies making async calls',
        author: 'Full Stack Open 2020',
        url: 'https://fullstackopen.com/en/part4/testing_the_backend',
        likes: 5
      }

      await api
        .post('/api/blogs')
        .set('Authorization', 'bearer')
        .send(newBlog)
        .expect(401)
    })


    test('adding blog post without likes defaults it to 0', async () => {
      const newBlog = {
        title: 'Blog Post without Likes',
        author: 'Tested',
        url: 'https://tobetested.com'
      }

      const users = await helper.initialUsers

      const token = await api
        .post('/api/login')
        .send(users)

      await api
        .post('/api/blogs')
        .set('Authorization', `bearer ${token.body.token}`)
        .send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()

      const newBlogLikesDefaultedToZero = blogsAtEnd.reduce(function (blogs, blog) {
        if (blog.title === 'Blog Post without Likes') {
          blogs.push(blog.likes)
        }
        return blogs
      }, [])

      expect(newBlogLikesDefaultedToZero).toContainEqual(0)
    })

    test('adding blog without title and url fails', async () => {
      const newBlog = {
        author: 'Tested',
        likes: 12
      }

      const blogsAtBeginning = await helper.blogsInDb()

      const users = await helper.initialUsers

      const token = await api
        .post('/api/login')
        .send(users)

      await api
        .post('/api/blogs')
        .set('Authorization', `bearer ${token.body.token}`)
        .send(newBlog)
        .expect(400)

      expect(blogsAtBeginning).toHaveLength(helper.initialBlogs.length)
    })
  })

  describe('deleting blog tests', () => {
    test('succeeds with status code 204 if id is valid', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()

      expect(blogsAtEnd).toHaveLength(
        helper.initialBlogs.length - 1
      )

      const titles = blogsAtEnd.map(r => r.title)
      expect(titles).not.toContain(blogToDelete.title)
    })
  })

  describe('update blog tests', () => {
    test('succeeds with valid blog', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToUpdate = blogsAtStart[0]
      const blogToUpdated = {
        ...blogToUpdate,
        likes: 20
      }

      await api
        .put(`/api/blogs/${blogToUpdated.id}`)
        .send(blogToUpdated)
        .expect(200)

      const blogsAtEnd = await helper.blogsInDb()

      expect(blogsAtEnd).toHaveLength(
        helper.initialBlogs.length
      )

      const titles = blogsAtEnd.map(r => r.title)
      expect(titles).toContain(blogToUpdated.title)

      const updatedBlogLikes = blogsAtEnd.reduce(function (blogs, blog) {
        if (blog.title === blogToUpdated.title) {
          blogs.push(blog.likes)
        }
        return blogs
      }, [])

      expect(updatedBlogLikes).toContain(20)
    })

    test('fails with invalid blog', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToUpdate = blogsAtStart[blogsAtStart.length]
      const blogToUpdated = {
        ...blogToUpdate,
        likes: 20
      }

      await api
        .put(`/api/blogs/${blogToUpdated.id}`)
        .send(blogToUpdated)
        .expect(500)
    })
  })

  describe('test user adding', () => {
    beforeEach(async () => {
      await User.deleteMany({})

      const passwordHash = await bcrypt.hash('sekret', 10)
      const user = new User({ username: 'root', passwordHash })

      await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'mluukkai',
        name: 'Matti Luukkainen',
        password: 'salainen',
      }

      await api
        .post('/api/users')
        .send(newUser)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

      const usernames = usersAtEnd.map(u => u.username)
      expect(usernames).toContain(newUser.username)
    })

    test('creation fails with proper statuscode and message if username already taken', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'root',
        name: 'Superuser',
        password: 'salainen',
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      expect(result.body.error).toContain('username must be unique')

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test('creation fails with proper statuscode and message if username does not contain enough characters', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'ro',
        name: 'Superuser',
        password: 'salainen',
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      expect(result.body.error).toContain('username must contain 3 or more characters')

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test('creation fails with proper statuscode and message if username missing', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        name: 'Superuser',
        password: 'salainen',
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      expect(result.body.error).toContain('username missing')

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test('creation fails with proper statuscode and message if password does not contain enough characters', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'roo',
        name: 'Superuser',
        password: 'sa',
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      expect(result.body.error).toContain('password must contain 3 or more characters')

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test('creation fails with proper statuscode and message if password missing', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'roo',
        name: 'Superuser',
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      expect(result.body.error).toContain('password missing')

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })
  })

  afterAll(() => {
    mongoose.connection.close()
  })
})