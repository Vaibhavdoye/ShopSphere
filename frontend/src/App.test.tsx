
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'

const mockProducts = [
  { id: 1, name: 'Wireless Headphones', price: 1499 },
  { id: 2, name: 'Smart Watch', price: 2199 },
]

beforeEach(() => {
  localStorage.clear()

  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ products: mockProducts }),
        })
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: null }),
      })
    }),
  )
})

describe('ShopSphere Frontend', () => {
  it('should render the homepage', async () => {
    render(<App />)

expect(screen.getAllByRole('link', { name: /Shop.*Sphere/ })).toHaveLength(2)
expect(
screen.getByRole('heading', { name: 'Shopping madesimple.' })
).toBeInTheDocument()
})

  it('should display products from API', async () => {
    render(<App />)

    expect(
      await screen.findByText('Wireless Headphones'),
    ).toBeInTheDocument()

    expect(screen.getByText('Smart Watch')).toBeInTheDocument()
  })

  it('should add a product to cart', async () => {
    render(<App />)

    await screen.findByText('Wireless Headphones')

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Add Wireless Headphones to cart',
      }),
    )

    expect(screen.getByText('Your Shopping Cart')).toBeInTheDocument()
   expect(screen.getAllByText('Wireless Headphones')).toHaveLength(2)
    expect(screen.getByText('Total: ₹1,499')).toBeInTheDocument()
  })

  it('should increase product quantity', async () => {
    render(<App />)

    await screen.findByText('Wireless Headphones')

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Add Wireless Headphones to cart',
      }),
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Increase Wireless Headphones quantity',
      }),
    )

    expect(screen.getByText('Total: ₹2,998')).toBeInTheDocument()
  })

  it('should open the login form', () => {
    render(<App />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Login / Register' }),
    )

    expect(screen.getByText('Welcome Back!')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })
})
