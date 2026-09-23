import { useState } from 'react'

const Blog = ({ blog, handleLike, handleDelete, user }) => {
  const [visible, setVisible] = useState(false)

  const toggleVisibility = () => {
    setVisible(!visible)
  }

  const showDelete = user && blog.user && user.username === blog.user.username

  return (
    <div className="blog">
      <span className="blogTitleAuthor">{blog.title} {blog.author}</span>
      <button onClick={toggleVisibility}>{visible ? 'hide' : 'view'}</button>
      {visible && (
        <div className="blogDetails">
          <div className="blogUrl">{blog.url}</div>
          <div className="blogLikes">
            likes {blog.likes}
            <button onClick={() => handleLike(blog)}>like</button>
          </div>
          <div>{blog.user ? blog.user.name : null}</div>
          {showDelete && (
            <div>
              <button onClick={() => handleDelete(blog)}>delete</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Blog
