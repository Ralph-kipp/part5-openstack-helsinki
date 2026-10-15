const BlogView = ({ blog, user, handleLike, handleDelete }) => {
  if (!blog) return null                  // blogs not loaded yet (e.g. after a page reload)

  const isCreator = user && blog.user && blog.user.username === user.username

  return (
    <div>
      <h3>{blog.title} {blog.author}</h3>
      <div><a href={blog.url}>{blog.url}</a></div>
      <div>
        likes {blog.likes}{' '}
        {user && <button onClick={() => handleLike(blog)}>like</button>}
      </div>
      {blog.user && <div>added by {blog.user.name}</div>}
      {isCreator && <button onClick={() => handleDelete(blog)}>delete</button>}
    </div>
  )
}

export default BlogView