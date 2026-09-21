import { useState, useEffect } from 'react'
import Blog from './components/Blog'
import Login from './components/Login'
import Notification from './components/Notification'
import blogService from './services/blogs'
import loginService from './services/login'

const App = () => {
  const [blogs, setBlogs] = useState([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [url, setUrl] = useState("")

  useEffect(() => {
    if (user) {
      blogService.getAll().then(blogs =>
        setBlogs(blogs)
      )
    }
  }, [user])

  const notify = (message) => {
    setErrorMessage(message)
    setTimeout(() => setErrorMessage(null), 5000)
  }

useEffect(() => {
  const loggedUserJSON = window.localStorage.getItem('loggedNoteAppUser')
  if (loggedUserJSON) {
    const loggedUser = JSON.parse(loggedUserJSON)
    setUser(loggedUser)
    blogService.setToken(loggedUser.token)
  }
}, [])

const handleLogin = async (event) => {
  event.preventDefault()
  try {
    const loggedUser = await loginService.login({ username, password })
    window.localStorage.setItem('loggedNoteAppUser', JSON.stringify(loggedUser))
    blogService.setToken(loggedUser.token)
    setUser(loggedUser)
    setUsername('')
    setPassword('')
  } catch {
    notify('Wrong username or password')
  }
}

const handleLogout = () => {
  window.localStorage.removeItem('loggedNoteAppUser')
  blogService.setToken(null)
  setUser(null)
  setBlogs([])
}

const handleTitleChange = (event) => {
  setTitle(event.target.value)
}

const handleAuthorChange = (event) => {
  setAuthor(event.target.value)
}

const handleUrlChange = (event) => {
  setUrl(event.target.value)
}

const handleCreateBlog = async (event) => {
  event.preventDefault()
  try {
    const newBlog = await blogService.create({ title, author, url })
    setBlogs(blogs.concat(newBlog))
    setTitle('')
    setAuthor('')
    setUrl('')
    notify(`a new blog ${newBlog.title} by ${newBlog.author} added`)
  } catch {
    notify('creating the blog failed')
  }
}

  if (!user) {
    return (
      <div>
        <Notification message={errorMessage} />
        <Login
          username={username}
          password={password}
          handleUsernameChange={({ target }) => setUsername(target.value)}
          handlePasswordChange={({ target }) => setPassword(target.value)}
          handleSubmit={handleLogin}
        />
      </div>
    )
  }


  return (
    <div>
      <h2>blogs</h2>

      <Notification message={errorMessage} />

      <p>
        {user.name} logged in
        <button onClick={handleLogout}>logout</button>
      </p>

      {blogs.map(blog =>
        <Blog key={blog.id} blog={blog} />
      )}

      <h3>create new</h3>
      <form onSubmit={handleCreateBlog}>
        <label>
          title
          <input
            type="text"
            name="Title"
            value={title}
            onChange={handleTitleChange}
          />
        </label>
        <label>
          author
          <input
            type="text"
            name="Author"
            value={author}
            onChange={handleAuthorChange}
          />
        </label>
        <label>
          URL
          <input
            type="text"
            name="url"
            value={url}
            onChange={handleUrlChange}
          />
        </label>
        <button type="submit">create</button>
      </form>
    </div>
  )
}

export default App
