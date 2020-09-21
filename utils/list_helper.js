const _ = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce(function (total, currentValue) {
    return total + currentValue.likes
  }, 0)
}

const favoriteBlog = (blogs) => {
  blogs.sort(function (a, b) {
    return b.likes - a.likes
  })

  // console.log(blogs)
  return blogs[0]
}

const mostBlogs = (blogs) => {
  const blogsByAuthor = _(blogs)
    .groupBy('author')
    .map(function(items, author) {
      return {
        author: author,
        blogs: items.length
      }
    }).value()
    .sort(function (a, b) {
      return b.blogs - a.blogs
    })
  // console.log('o', blogsByAuthor)
  return blogsByAuthor[0]
}

const mostLikes = (blogs) => {
  const reducer = (accumulator, currentValue) => accumulator + currentValue.likes

  const blogsByAuthor = _(blogs)
    .groupBy('author').map(function(items, author) {
      return {
        author: author,
        likes: items.reduce(reducer, 0)
      }
    }).value()
    .sort(function (a, b) {
      return b.likes - a.likes
    })

  // console.log('p', blogsByAuthor)
  return blogsByAuthor[0]
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}