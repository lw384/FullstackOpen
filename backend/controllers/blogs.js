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

blogsRouter.delete('/:id', async (request, response, next) => {
    // express 5.x 之后可以自动处理 try catch 不需要 express-async-errors 插件了，也不需要写 try catch 💨
    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
})

blogsRouter.put('/:id', async (request, response, next) => {
    const { likes } = request.body

    if (!likes){
        return response.status(400).json({ error: 'likes are missing' })
    }

    const blog = await Blog.findById(request.params.id)
    blog.likes = likes
    const saveBlog = await blog.save()
    response.json(saveBlog)
})

module.exports = blogsRouter