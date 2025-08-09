const blogsRouter = require('express').Router()

const Blog = require('../models/blogs')
blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({})
    response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {
    const blogs = await Blog.findById(request.params.id)
    response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
    const body = request.body

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.author,
        likes: body.likes || 0,
    })

    if (!blog.title || !blog.url) {
        return response.status(400).json({ error: 'title or url missing' })
    }
    const saveBlog = await blog.save()
    response.status(201).json(saveBlog)
})

module.exports = blogsRouter