const blogsRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/blogs')
const { error } = require('../utils/logger')


blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {
    const blogs = await Blog.findById(request.params.id)
    response.json(blogs)
})

// add new blog
blogsRouter.post('/', async (request, response) => {
    const body = request.body

    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if (!decodedToken.id) {
        return response.status(401).json({ error: 'token invalid' })
    }
    const user = request.user
    if (!user) {
        return response.status(401).json({ error: 'UserId missing or not valid' })
    }

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.author,
        likes: body.likes || 0,
        user: user._id
    })

    if (!blog.title || !blog.url) {
        return response.status(400).json({ error: 'title or url missing' })
    }
    const saveBlog = await blog.save()
    response.status(201).json(saveBlog)
})

blogsRouter.delete('/:id', async (request, response, next) => {
    // express 5.x 之后可以自动处理 try catch 不需要 express-async-errors 插件了，也不需要写 try catch 💨
    const blog = await Blog.findById(request.params.id)
    const user = request.user

    if (!blog) {
        return response.status(400).json({ error: 'Blog not found' })
    }

    if (blog.user._id.toString() === user._id.toString()) {
        await Blog.findByIdAndDelete(request.params.id)
        response.status(204).end()
    } else {
        response.status(400).json({ error: 'Only creater can delete' })
    }
})

blogsRouter.put('/:id', async (request, response, next) => {
    const { likes } = request.body

    if (!likes) {
        return response.status(400).json({ error: 'likes are missing' })
    }

    const blog = await Blog.findById(request.params.id)
    blog.likes = likes
    const saveBlog = await blog.save()
    response.json(saveBlog)
})

module.exports = blogsRouter