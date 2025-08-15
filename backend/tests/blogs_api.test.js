const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const Blog = require('../models/blogs')
const User = require('../models/user')
const app = require('../app')

const api = supertest(app)

const initialBlogs = [
    {
        title: 'test blog one',
        author: 'author1',
        url: 'http://link',
        likes: 1,
    },
    {
        title: 'test blog two',
        author: 'author2',
        url: 'http://link',
        likes: 3777,
    }
]

let token
let userId

beforeEach(async () => {
    // 清理数据库
    await Blog.deleteMany({})
    await User.deleteMany({})

    // 创建测试用户
    const passwordHash = await bcrypt.hash('sekret', 10)
    const testUser = new User({
        username: 'root',
        name: 'Test User',
        passwordHash: passwordHash
    })
    const savedUser = await testUser.save()
    userId = savedUser._id

    // 登录获取token
    const loginResponse = await api
        .post('/api/login')
        .send({
            username: 'root',
            password: 'sekret'
        })
        .expect(200)

    token = loginResponse.body.token

    // 创建与用户关联的博客
    const blogObjects = initialBlogs.map(blog => new Blog({
        ...blog,
        user: userId
    }))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})

const BlogsInDb = async () => {
    const blogs = await Blog.find({})
    return blogs.map(blog => blog.toJSON())
}

describe('add a new blog', () => {
    test('all blogs are returned as json', async () => {
        await api
            .get('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })
    test('only user can add blog', async () => {
        const newBlog = {
            title: 'No token blog',
            author: 'Tester',
            url: 'http://example.com',
            likes: 5
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(401)
    })

    test('a valid blog can be added', async () => {
        const newBlog = {
            title: 'a new blog',
            author: 'author3',
            url: 'http://link',
            likes: '3733',
        }

        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogAtEnd = await BlogsInDb()
        assert.strictEqual(blogAtEnd.length, initialBlogs.length + 1)

        const contents = blogAtEnd.map(n => n.title)
        assert(contents.includes('a new blog'))
    })



    test('all blogs are returned', async () => {
        const response = await api.get('/api/blogs').set('Authorization', `Bearer ${token}`)
        assert.strictEqual(response.body.length, initialBlogs.length)
    })
    test('a specific blog can be viewed', async () => {
        const blogAtStart = await BlogsInDb()
        const blogToView = blogAtStart[0]

        const result = await api
            .get(`/api/blogs/${blogToView.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        assert.strictEqual(result.body.title, blogToView.title)
        assert.strictEqual(result.body.author, blogToView.author)
        assert.strictEqual(result.body.url, blogToView.url)
        assert.strictEqual(result.body.likes, blogToView.likes)
        assert.strictEqual(result.body.user.toString(), blogToView.user.toString())
    })
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
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    // 断言返回数据中 likes 是 0
    assert.strictEqual(response.body.likes, 0)
})

test('if title or url property is missing, return 400', async () => {
    const newBlog = {
        author: "Author Name",
        // 注意没有 title 和 url 属性
    }

    await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(400)
        .expect('Content-Type', /application\/json/)
})

describe('deletion of a blog', () => {
    test('succeeds with status code 204 if id is valid', async () => {
        const blogAtStart = await BlogsInDb()
        const blogToDelete = blogAtStart[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204)

        const blogAtEnd = await BlogsInDb()
        const title = blogAtEnd.map(n => n.title)
        assert(!title.includes(blogToDelete.title))

        assert.strictEqual(blogAtEnd.length, initialBlogs.length - 1)
    })

    test('fails with status code 400 if blog does not exist', async () => {
        const nonExistentId = new mongoose.Types.ObjectId()

        await api
            .delete(`/api/blogs/${nonExistentId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
    })
})

describe('update a blog', () => {
    test('succeeds with valid data', async () => {
        const blogAtStart = await BlogsInDb()
        const updateBlog = blogAtStart[0]
        await api
            .put(`/api/blogs/${updateBlog.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ likes: 200 })
            .expect(200)

        const blogAtEnd = await BlogsInDb()
        const blogUpdate = blogAtEnd.find(blog => blog.id == updateBlog.id)
        assert.strictEqual(blogUpdate.likes, 200)
    })

    test('fail with status code 400 if likes invalid', async () => {
        const blogAtStart = await BlogsInDb()
        const updateBlog = blogAtStart[0]
        await api
            .put(`/api/blogs/${updateBlog.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({})
            .expect(400)
    })
})

describe('delete a blog', () => {
    test('only creator can delete', async () => {
        const blogAtStart = await BlogsInDb()
        const blogToDelete = blogAtStart[0]
        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204)
    })

    test('non-creator cannot delete blog', async () => {
        // 创建另一个用户
        const anotherPasswordHash = await bcrypt.hash('password123', 10)
        const anotherUser = new User({
            username: 'another',
            name: 'Another User',
            passwordHash: anotherPasswordHash
        })
        await anotherUser.save()

        // 为另一个用户创建博客
        const anotherBlog = new Blog({
            title: 'Another user blog',
            author: 'Another Author',
            url: 'http://example.com',
            likes: 5,
            user: anotherUser._id
        })
        await anotherBlog.save()

        // 尝试用第一个用户删除另一个用户的博客
        await api
            .delete(`/api/blogs/${anotherBlog.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
    })
})




after(async () => {
    await mongoose.connection.close()
})