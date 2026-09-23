import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect, vi } from 'vitest'
import Blog from '../src/components/Blog'

const blog = {
  id: '1',
  title: 'Testing forms',
  author: 'Matti Luukkainen',
  url: 'http://example.com',
  likes: 5,
  user: { id: 'u1', name: 'Test User' }
}

test('<Blog /> shows title and author, but not url or likes, by default', () => {
  const { container } = render(<Blog blog={blog} handleLike={() => {}} />)

  const titleAuthor = container.querySelector('.blogTitleAuthor')
  expect(titleAuthor).toHaveTextContent('Testing forms')
  expect(titleAuthor).toHaveTextContent('Matti Luukkainen')

  expect(container.querySelector('.blogUrl')).toBeNull()
  expect(container.querySelector('.blogLikes')).toBeNull()
})

test('<Blog /> shows url and likes after the view button is clicked', async () => {
  const user = userEvent.setup()
  render(<Blog blog={blog} handleLike={() => {}} />)

  await user.click(screen.getByText('view'))

  expect(screen.getByText('http://example.com')).toBeVisible()
  expect(screen.getByText('likes 5')).toBeVisible()
})

test('<Blog /> calls handleLike with the blog when the like button is clicked twice', async () => {
  const handleLike = vi.fn()
  const user = userEvent.setup()
  render(<Blog blog={blog} handleLike={handleLike} />)

  await user.click(screen.getByText('view'))
  const likeButton = screen.getByText('like')

  await user.click(likeButton)
  await user.click(likeButton)

  expect(handleLike.mock.calls).toHaveLength(2)
  expect(handleLike.mock.calls[0][0]).toEqual(blog)
})
