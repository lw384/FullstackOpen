import { useState, useEffect } from 'react'
import noteService from './services/notes'

import './App.css'
import Header from './components/Header'
import Content from './components/Content/content'
import Note from './components/Note'
import Notification from './components/Notification'


function App() {
  const course = [
    {
      id:1,
      name: 'Half Stack application development',
      parts: [{
        name: 'Fundamentals of React',
        exercises: 10
      },{
        name: 'Using props to pass data',
        exercises: 7
      },{
        name: 'State of a component',
        exercises: 14
      }]
    },
    {
      name: 'Node.js',
      id: 2,
      parts: [
        {
          name: 'Routing',
          exercises: 3,
          id: 1
        },
        {
          name: 'Middlewares',
          exercises: 7,
          id: 2
        }
      ]
    }
  ]

  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState(
    'a new note...'
  ) 
  const [errorMessage, setErrorMessage] = useState('some error happened...')

  const hook = () => {
    console.log('effect')
    noteService
    .getAll()
    .then(response => {
      setNotes(response)
    }).catch(error => {
      console.log('fail')
    })
  }
  useEffect(hook, [])

  const addNote = (event) => {
    event.preventDefault()
    const noteObject = {
      content: newNote,
      id: notes.length + 1
    }
    noteService
      .create(noteObject)
      .then(response => {
        setNotes(notes.concat(response))
        setNewNote('')
      }).catch(error => {
        console.log('fail')
      })
  }
  
  const handleNoteChange = (event) => {
    setNewNote(event.target.value)
  }
  const toggleImportanceOf = (id) => {
  const note = notes.find(n => n.id === id)
  const changedNote = { ...note, important: !note.important }

  noteService
      .update(id, changedNote)
      .then(response => {
        setNotes(notes.map(note => note.id === id ? response : note))
      }).catch(error => {
        console.log('fail')
      })
  }


  return (<>
  <div>
  <Notification message={errorMessage} />
  <h1>course</h1>
  {
  course.map(c=><Content key={c.id} course={c} />)
  }
  <h1>note</h1>
  <div>
  <ul>
        {notes.map(note => 
          <Note key={note.id} note={note} toggleImportance={() => toggleImportanceOf(note.id)} />
        )}
      </ul>
      <form onSubmit={addNote}>
        <input value={newNote} onChange={handleNoteChange}/>
        <button type="submit">save</button>
      </form>   
    </div>
  </div>
  </>)
   
}

export default App
