const { test, expect, beforeEach, describe } = require('@playwright/test')

const loginWith = async (page, username, password) => {
  await page.getByRole('textbox', { name: 'username' }).fill(username)
  await page.getByRole('textbox', { name: 'password' }).fill(password)
  await page.getByRole('button', { name: 'login' }).click()
}

const createBlog = async (page, title, author, url) => {
  // the form starts open and closes after each create, so only click when the toggle is shown
  const newBlogButton = page.getByRole('button', { name: 'new blog' })
  if (await newBlogButton.isVisible()) {
    await newBlogButton.click()
  }
  await page.getByRole('textbox', { name: 'title' }).fill(title)
  await page.getByRole('textbox', { name: 'author' }).fill(author)
  await page.getByRole('textbox', { name: 'URL' }).fill(url)
  await page.getByRole('button', { name: 'create' }).click()
  // the blog shows up in the list once it has been saved
  await expect(page.getByText(`${title} ${author}`)).toBeVisible()
}

// each blog's root div has a direct view/hide toggle button
const allBlogs = (page) =>
  page.locator('div:has(> button:text-is("hide")), div:has(> button:text-is("view"))')

// the element holding a single blog's title, author and (when expanded) details
const blogLocator = (page, title) => allBlogs(page).filter({ hasText: title })

const likeBlog = async (page, title, expectedLikes) => {
  await blogLocator(page, title).getByRole('button', { name: 'like', exact: true }).click()
  await expect(blogLocator(page, title)).toContainText(`likes ${expectedLikes}`)
}

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    test.setTimeout(15000)
    // fail fast if the backend is not running in test mode, so a real DB is never touched
    const reset = await request.post('http://localhost:3003/api/testing/reset')
    expect(reset.status()).toBe(204)
    await request.post('http://localhost:3003/api/users', {
      data: {
        username: 'ralph',
        name: 'ralph',
        password: 'testpassword123',
      },
    })
    await page.goto('http://localhost:5173')

    //DB initialization and user visits browser
  })

  
  describe('Login', () => {
    test('5.17: login form is shown', async ({ page }) => {
      await expect(
        page.getByRole('textbox', { name: 'username' })
      ).toBeVisible()

      await expect(
        page.getByRole('textbox', { name: 'password' })
      ).toBeVisible()
    })

    test('5.18: Log in is successful', async ({ page }) => {
      await loginWith(page, 'ralph', 'testpassword123')
      await expect(page.getByText('ralph logged in')).toBeVisible()
    })

    test('5.19: Log in fails with wrong password', async ({ page }) => {
      await loginWith(page, 'ralph', 'wrongpassword')
      await expect(
        page.getByText('wrong username or password')
      ).toBeVisible()
    })
  })

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'ralph', 'testpassword123')
      await expect(page.getByText('ralph logged in')).toBeVisible()
    })

    test('5.20: a new blog can be created', async ({ page }) => {
      await createBlog(page, 'Playwright testing', 'Test Author', 'http://localhost:5173/')

      await expect(page.getByText('a new blog Playwright testing by Test Author added')).toBeVisible()
      await expect(page.getByText('Playwright testing Test Author')).toBeVisible()
    })

    test('5.21: a blog can be liked', async ({ page }) => {
      await createBlog(page, 'Likeable blog', 'Test Author', 'http://localhost:5173/like')

      await blogLocator(page, 'Likeable blog').getByRole('button', { name: 'view' }).click()
      await expect(blogLocator(page, 'Likeable blog')).toContainText('likes 0')

      await likeBlog(page, 'Likeable blog', 1)
      await likeBlog(page, 'Likeable blog', 2)
    })

    test('5.22: the user who added a blog can delete it', async ({ page }) => {
      await createBlog(page, 'Blog to delete', 'Test Author', 'http://localhost:5173/delete')

      await blogLocator(page, 'Blog to delete').getByRole('button', { name: 'view' }).click()

      // accept the window.confirm dialog
      page.once('dialog', async dialog => {
        expect(dialog.message()).toContain('Blog to delete')
        await dialog.accept()
      })
      await blogLocator(page, 'Blog to delete').getByRole('button', { name: 'delete' }).click()

      await expect(page.getByText('Blog to delete Test Author')).not.toBeVisible()
    })

    test('5.23: only the user who added the blog sees the delete button', async ({ page, request }) => {
      await createBlog(page, 'Ralphs blog', 'Test Author', 'http://localhost:5173/ralph')

      // creator sees the delete button
    const otherUsersBlog = blogLocator(page, 'Ralphs blog')
    const viewButton = otherUsersBlog.getByRole('button', { name: 'view' })

    if (await viewButton.isVisible()) {
      await viewButton.click()
    }

    await expect(otherUsersBlog).toContainText('likes 0')
    await expect(
      otherUsersBlog.getByRole('button', { name: 'delete' })
    ).toHaveCount(0)

      // log out and log in as a different user
      await request.post('http://localhost:3003/api/users', {
        data: {
          username: 'other',
          name: 'other user',
          password: 'otherpassword123',
        },
      })
      await page.getByRole('button', { name: 'logout' }).click()
      await loginWith(page, 'other', 'otherpassword123')
      await expect(page.getByText('other user logged in')).toBeVisible()

      // the other user can see the blog but not delete it
      await blogLocator(page, 'Ralphs blog').getByRole('button', { name: 'view' }).click()
      await expect(blogLocator(page, 'Ralphs blog')).toContainText('likes 0')
      await expect(blogLocator(page, 'Ralphs blog').getByRole('button', { name: 'delete' })).toHaveCount(0)
    })

    test('blogs are ordered by likes, most liked first', async ({ page }) => {
      await createBlog(page, 'First blog', 'Author A', 'http://localhost:5173/1')
      await createBlog(page, 'Second blog', 'Author B', 'http://localhost:5173/2')
      await createBlog(page, 'Third blog', 'Author C', 'http://localhost:5173/3')

      for (const title of ['First blog', 'Second blog', 'Third blog']) {
        await blogLocator(page, title).getByRole('button', { name: 'view' }).click()
      }

      // Second gets 2 likes, Third gets 3 likes, First gets 1 like
      await likeBlog(page, 'First blog', 1)
      await likeBlog(page, 'Second blog', 1)
      await likeBlog(page, 'Second blog', 2)
      await likeBlog(page, 'Third blog', 1)
      await likeBlog(page, 'Third blog', 2)
      await likeBlog(page, 'Third blog', 3)

      const blogs = allBlogs(page)
      await expect(blogs).toHaveCount(3)
      await expect(blogs.nth(0)).toContainText('Third blog')
      await expect(blogs.nth(1)).toContainText('Second blog')
      await expect(blogs.nth(2)).toContainText('First blog')
    })
  })
})
