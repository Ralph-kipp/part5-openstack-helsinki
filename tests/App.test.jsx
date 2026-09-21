import { render, screen } from '@testing-library/react'
import { test, expect } from 'vitest'
import App from '../src/App'

test('renders the login form when no user is logged in', () => {
  render(<App />)

  expect(screen.getByText('log in to application')).toBeInTheDocument()
})
