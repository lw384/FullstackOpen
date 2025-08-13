const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
    const users = await User
        .find({}).populate('notes')

    response.json(users)
})

usersRouter.post('/', async (request, response) => {
    const { username, name, password } = request.body

    // 校验用户名长度
    if (!username || username.length < 3) {
        return response.status(400).json({ error: 'username must be at least 3 characters long' })
    }

    // 校验密码长度
    if (!password || password.length < 3) {
        return response.status(400).json({ error: 'password must be at least 3 characters long' })
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username })
    if (existingUser) {
        return response.status(400).json({ error: 'expected `username` to be unique' })
    }


    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const user = new User({
        username,
        name,
        passwordHash,
    })

    const savedUser = await user.save()

    response.status(201).json(savedUser)
})

module.exports = usersRouter