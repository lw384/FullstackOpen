const notesRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const Note = require('../models/notes')
const User = require('../models/user')


notesRouter.get('/', async (request, response) => {
    const notes = await Note
        .find({}).populate('user', { username: 1, name: 1 })

    response.json(notes)
})

notesRouter.get('/:id', (request, response, next) => {
    Note.findById(request.params.id)
        .then(note => {
            if (note) {
                response.json(note)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

notesRouter.post('/', async (request, response, next) => {
    const body = request.body

    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if (!decodedToken.id) {
        return response.status(401).json({ error: 'token invalid' })
    }
    const user = await User.findById(decodedToken.id)
    if (!user) {
        return response.status(400).json({ error: 'UserId missing or not valid' })
    }

    const note = new Note({
        content: body.content,
        important: body.important || false,
        user: user._id
    })

    const savedNote = await note.save()
    user.notes = user.notes.concat(savedNote._id)
    await user.save()

    response.status(201).json(savedNote)
})

notesRouter.delete('/:id', async (request, response, next) => {
    // express 5.x 之后可以自动处理 try catch 不需要 express-async-errors 插件了，也不需要写 try catch 💨
    await Note.findByIdAndDelete(request.params.id)
    response.status(204).end()
})

notesRouter.put('/:id', (request, response, next) => {
    const { content, important } = request.body

    Note.findById(request.params.id)
        .then(note => {
            if (!note) {
                return response.status(404).end()
            }

            note.content = content
            note.important = important

            return note.save().then((updatedNote) => {
                response.json(updatedNote)
            })
        })
        .catch(error => next(error))
})

module.exports = notesRouter