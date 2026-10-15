const { test, expect } = require('@playwright/test')

const loginWith = async (page, username, password) => {
  await page.getByRole('textbox', { name: 'username' }).fill(username)
  await page.getByRole('textbox', { name: 'password' }).fill(password)
  await page.getByRole('button', { name: 'login' }).click()
}

const createBlog = async (page, title, author, url) => {
  await page.getByRole('link', { name: 'new blog' }).click()
  await page.getByRole('textbox', { name: 'title' }).fill(title)
  await page.getByRole('textbox', { name: 'author' }).fill(author)
  await page.getByRole('textbox', { name: 'URL' }).fill(url)
  await page.getByRole('button', { name: 'create' }).click()
  await expect(page.getByRole('link', { name: `${title} ${author}` })).toBeVisible()
}

const openBlog = async (page, title) => {
  await page.getByRole('link', { name: title }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
}

const goToList = (page) => page.getByRole('link', { name: 'blogs', exact: true }).click()

const likeBlog = async (page, expectedLikes) => {
  await page.getByRole('button', { name: 'like', exact: true }).click()
  await expect(page.getByText(`likes ${expectedLikes}`)).toBeVisible()
}

const createUser = async (request, user) => {
  const response = await request.post('http://localhost:3003/api/users', { data: user })
  expect(response.status(), `creating user ${user.username} failed: ${await response.text()}`).toBe(201)
}

test.describe('Blog app', () => {
  test.beforeEach(async ({ page, request }) => {
    test.setTimeout(15000)
    const reset = await request.post('http://localhost:3003/api/testing/reset')
    expect(reset.status()).toBe(204)
    await createUser(request, { username: 'ralph', name: 'ralph', password: 'testpassword123' })
    await page.goto('http://localhost:5173/login')
  })

  test.describe('Login', () => {
    test('login form is shown', async ({ page }) => {
      await expect(page.getByRole('textbox', { name: 'username' })).toBeVisible()
      await expect(page.getByRole('textbox', { name: 'password' })).toBeVisible()
    })

    test('login succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'ralph', 'testpassword123')
      await expect(page.getByText('ralph logged in')).toBeVisible()
    })

    test('login fails with wrong password', async ({ page }) => {
      await loginWith(page, 'ralph', 'wrongpassword')
      await expect(page.getByText('wrong username or password')).toBeVisible()
      await expect(page.getByText('ralph logged in')).not.toBeVisible()
    })
  })

  test.describe('When logged in', () => {
    test.beforeEach(async ({ page }) => {
      await loginWith(page, 'ralph', 'testpassword123')
      await expect(page.getByText('ralph logged in')).toBeVisible()
    })

    test('a new blog can be created', async ({ page }) => {
      await createBlog(page, 'Playwright testing', 'Test Author', 'http://localhost:5173/')
      await expect(page.getByText('a new blog Playwright testing by Test Author added')).toBeVisible()
    })

    test('a blog can be liked', async ({ page }) => {
      await createBlog(page, 'Likeable blog', 'Test Author', 'http://localhost:5173/like')
      await openBlog(page, 'Likeable blog')
      await expect(page.getByText('likes 0')).toBeVisible()
      await likeBlog(page, 1)
      await likeBlog(page, 2)
    })

    test('the user who added a blog can delete it', async ({ page }) => {
      await createBlog(page, 'Blog to delete', 'Test Author', 'http://localhost:5173/delete')
      await openBlog(page, 'Blog to delete')
      page.once('dialog', async dialog => {
        expect(dialog.message()).toContain('Blog to delete')
        await dialog.accept()
      })
      await page.getByRole('button', { name: 'delete' }).click()
      await expect(page.getByRole('link', { name: 'Blog to delete Test Author' })).not.toBeVisible()
    })

    test('only the creator sees the delete button', async ({ page, request }) => {
      await createBlog(page, 'Ralphs blog', 'Test Author', 'http://localhost:5173/ralph')
      await openBlog(page, 'Ralphs blog')
      await expect(page.getByRole('button', { name: 'delete' })).toBeVisible()

      await createUser(request, { username: 'other', name: 'other user', password: 'otherpassword123' })
      await page.getByRole('button', { name: 'logout' }).click()
      await page.getByRole('link', { name: 'login' }).click()
      await loginWith(page, 'other', 'otherpassword123')
      await expect(page.getByText('other user logged in')).toBeVisible()

      await openBlog(page, 'Ralphs blog')
      await expect(page.getByRole('button', { name: 'like', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'delete' })).toHaveCount(0)
    })

    test('blogs are ordered by likes, most liked first', async ({ page }) => {
      await createBlog(page, 'First blog', 'Author A', 'http://localhost:5173/1')
      await createBlog(page, 'Second blog', 'Author B', 'http://localhost:5173/2')
      await createBlog(page, 'Third blog', 'Author C', 'http://localhost:5173/3')

      const likes = { 'First blog': 1, 'Second blog': 2, 'Third blog': 3 }
      for (const [title, count] of Object.entries(likes)) {
        await openBlog(page, title)
        for (let i = 1; i <= count; i++) await likeBlog(page, i)
        await goToList(page)
      }

      const links = page.getByRole('link', { name: /Author/ })
      await expect(links).toHaveCount(3)
      await expect(links.nth(0)).toContainText('Third blog')
      await expect(links.nth(1)).toContainText('Second blog')
      await expect(links.nth(2)).toContainText('First blog')
    })
  })
})