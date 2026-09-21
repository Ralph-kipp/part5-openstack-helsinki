import { useState, useEffect, useRef } from 'react'
import Blog from './components/Blog'
import BlogForm from './components/BlogForm'
import Login from './components/Login'
import Notification from './components/Notification'
import Togglable from './components/Togglable'
import blogService from './services/blogs'
import loginService from './services/login'

const App = () => {
  const [blogs, setBlogs] = useState([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const blogFormRef = useRef()

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

const handleCreateBlog = async (blogObject) => {
  try {
    const newBlog = await blogService.create(blogObject)
    setBlogs(blogs.concat(newBlog))
    blogFormRef.current.toggleVisibility()
    notify(`a new blog ${newBlog.title} by ${newBlog.author} added`)
  } catch {
    notify('creating the blog failed')
  }
}

  if (!user) {
    return (
      <div>
        <Notification message={errorMessage} />
        <Togglable buttonLabel="log in">
          <Login
            username={username}
            password={password}
            handleUsernameChange={({ target }) => setUsername(target.value)}
            handlePasswordChange={({ target }) => setPassword(target.value)}
            handleSubmit={handleLogin}
          />
        </Togglable>
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

      <Togglable buttonLabel="new blog" ref={blogFormRef}>
        <BlogForm createBlog={handleCreateBlog} />
      </Togglable>
    </div>
  )
}

export default App
