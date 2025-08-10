const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const Blog = require('../models/blogs')
const app = require('../app')
const blogs = require('../models/blogs')

const api = supertest(app)

const initialBlogs = [
    {
        title: 'test blog one',
        author: 'author1',
        url: 'http://link',
        likes: '1',
    },
    {
        title: 'test blog two',
        author: 'author2',
        url: 'http://link',
        likes: '3777',
    }
]

// const nonExistingId = async () => {
//     const note = new Blog({ content: 'willremovethissoon' })
//     await note.save()
//     await note.deleteOne()

//     return note._id.toString()
// }

const BlogsInDb = async () => {
    const blogs = await Blog.find({})
    console.log(blogs)
    return blogs.map(blog => blog.toJSON())
}

beforeEach(async () => {
    await Blog.deleteMany({})
    const blogObjects = initialBlogs.map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})

test('all blogs are returned as json', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')
    assert.strictEqual(response.body.length, initialBlogs.length)
})

test('a specific blog can be viewed', async () => {
    const blogAtStart = await BlogsInDb()
    const blogToView = blogAtStart[0]

    const result = await api
        .get(`/api/blogs/${blogToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

    assert.deepStrictEqual(result.body, blogToView)
})


test('a valid blog can be added', async () => {
    const newBlog = {
        title: 'test blog 3',
        author: 'author3',
        url: 'http://link',
        likes: '3733',
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const blogAtEnd = await BlogsInDb()
    assert.strictEqual(blogAtEnd.length, initialBlogs.length + 1)

    const contents = blogAtEnd.map(n => n.title)
    assert(contents.includes('test blog 3'))
})

test('if likes property is missing, it defaults to 0', async () => {
    const newBlog = {
        title: "Blog without likes",
        author: "Author Name",
        url: "http://example.com"
        // 注意没有 likes 属性
    }

    const response = await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    // 断言返回数据中 likes 是 0
    assert.strictEqual(response.body.likes, 0)
})

test('if title or url property is missing, return 400', async () => {
    const newBlog = {
        author: "Author Name",
        // 注意没有 likes 属性
    }

    const response = await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)
        .expect('Content-Type', /application\/json/)
})

describe('deletion of a blog', () => {
    test('succeeds with status code 204 id id is valid', async () => {
        const blogAtStart = await BlogsInDb()
        const blogToDelete = blogAtStart[0]

        await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)

        const blogAtEnd = await BlogsInDb()
        const title = blogAtEnd.map(n => n.title)
        assert(!title.includes(blogToDelete.title))

        assert.strictEqual(blogAtEnd.length, initialBlogs.length - 1)
    })
})

describe('update a blog', () => {
    test('succeeds with valid data', async () => {
        const blogAtStart = await BlogsInDb()
        const updateBlog = blogAtStart[0]
        await api.put(`/api/blogs/${updateBlog.id}`).send({ likes: 200 }).expect(200)

        const blogAtEnd = await BlogsInDb()
        const blogUpdate = blogAtEnd.find(blog => blog.id == updateBlog.id)
        assert.strictEqual(blogUpdate.likes, 200)
    })
    test('fail with status code 400 if likes invalid', async () => {
        const blogAtStart = await BlogsInDb()
        const updateBlog = blogAtStart[0]
        await api.put(`/api/blogs/${updateBlog.id}`).send({}).expect(400)
    })
})




after(async () => {
    await mongoose.connection.close()
})