
import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const AUTH_URL = `${API_URL}/auth`
type Product = {
  id: number
  name: string
  price: number
  category: string
  emoji: string
}

type CartItem = {
  id: number
  name: string
  price: number
  quantity: number
}

type User = {
  id: number
  name: string
  email: string
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
const [cart, setCart] = useState<CartItem[]>(() => {
  try {
    const savedCart = localStorage.getItem('shopsphere-cart')
    return savedCart ? JSON.parse(savedCart) as CartItem[] : []
  } catch {
    return []
  }
})
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showAuth, setShowAuth] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState<User | null>(null)
const [token, setToken] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)


  useEffect(() => {
fetch(`${API_URL}/products`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load products')
        return response.json()
      })
      .then((data) => {
        const icons = ['🎧', '⌚', '🎒', '👟']
        const categories = [
          'Electronics',
          'Accessories',
          'Lifestyle',
          'Fashion',
        ]

        setProducts(
          data.products.map(
            (product: { id: number; name: string; price: number }, index: number) => ({
              ...product,
              emoji: icons[index % icons.length],
              category: categories[index % categories.length],
            }),
          ),
        )
      })
      .catch((error) => console.error('Products API error:', error))
  }, [])

  
  useEffect(() => {
    const savedToken = localStorage.getItem('token')

    if (!savedToken) return

    fetch(`${AUTH_URL}/me`, {
      headers: {
        Authorization: `Bearer ${savedToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Session expired')
        }
        return response.json()
      })
      .then((data) => {
        setUser(data.user)
        setToken(savedToken)
      })
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
        setToken(null)
      })
  }, [])


  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]
    })
  }

const updateQuantity = (id: number, change: number) => {
  setCart((current) =>
    current
      .map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + change }
          : item
      )
      .filter((item) => item.quantity > 0)
  )
}

const removeFromCart = (id: number) => {
  setCart((current) => current.filter((item) => item.id !== id))
}

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthMessage('')
    setAuthLoading(true)

    try {
      const endpoint =
        authMode === 'register' ? '/register' : '/login'

      const payload =
        authMode === 'register'
          ? { name: name.trim(), email: email.trim(), password }
          : { email: email.trim(), password }

      const response = await fetch(`${AUTH_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.')
      }

      setUser(data.user)
      setToken(data.token)
      localStorage.setItem('token', data.token)
      setAuthMessage(
        authMode === 'register'
          ? 'Account created successfully!'
          : 'Login successful!',
      )
      setPassword('')
      setShowAuth(false)
    } catch (error) {
      setAuthMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setAuthLoading(false)
    }
  }

  
const logout = () => {
  localStorage.removeItem('token')
  setUser(null)
  setToken(null)
  setAuthMessage('You have been logged out.')
  setShowAuth(false)
}


  return (
    <div className="app">
      <div className="announcement">
        Welcome to ShopSphere — Your everyday shopping destination
      </div>

      <header className="navbar">
        <a className="logo" href="#">
          Shop<span>Sphere</span>
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#products">Products</a>
          <a href="#about">About</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <span style={{ fontSize: 14 }}>
                Hi, {user.name}
              </span>
              <button className="add-btn" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <button
              className="primary-btn"
              onClick={() => {
                setAuthMode('login')
                setAuthMessage('')
                setShowAuth((current) => !current)
              }}
            >
              Login / Register
            </button>
          )}

          <a className="cart" href="#cart">
            🛒 Cart <span>{cartCount}</span>
          </a>
        </div>
      </header>

      {authMessage && (
        <p
          role="status"
          style={{ textAlign: 'center', padding: 10 }}
        >
          {authMessage}
        </p>
      )}

      {showAuth && (
        <section
          style={{
            maxWidth: 420,
            margin: '28px auto',
            padding: 24,
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            background: '#fff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            {authMode === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h2>

          <p>
            {authMode === 'login'
              ? 'Login to your ShopSphere account.'
              : 'Register to get started with ShopSphere.'}
          </p>

          <form
            onSubmit={handleAuth}
            style={{ display: 'grid', gap: 14 }}
          >
            {authMode === 'register' && (
              <input
                aria-label="Full name"
                placeholder="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                style={{ padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
              />
            )}

            <input
              aria-label="Email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              style={{ padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
            />

            <input
              aria-label="Password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
minLength={authMode === 'login' ? 1 : 8}
              autoComplete={
                authMode === 'login' ? 'current-password' : 'new-password'
              }
              style={{ padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
            />

            {authMessage && (
              <p role="alert" style={{ color: '#b42318', margin: 0 }}>
                {authMessage}
              </p>
            )}

            <button
              className="primary-btn"
              type="submit"
              disabled={authLoading}
            >
              {authLoading
                ? 'Please wait...'
                : authMode === 'login'
                  ? 'Login'
                  : 'Create Account'}
            </button>
          </form>

          <p style={{ marginBottom: 0 }}>
            {authMode === 'login'
              ? "Don't have an account? "
              : 'Already registered? '}
            <button
              type="button"
              onClick={() => {
                setAuthMode((current) =>
                  current === 'login' ? 'register' : 'login',
                )
                setAuthMessage('')
              }}
              style={{
                border: 0,
                background: 'none',
                color: '#15803d',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {authMode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </section>
      )}

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <p className="eyebrow">YOUR STYLE, YOUR CHOICE</p>
            <h1>
              Shopping made
              <br />
              simple.
            </h1>
            <p className="hero-text">
              Discover everyday essentials, the latest accessories,
              and products you’ll love — all in one place.
            </p>
            <a className="primary-btn" href="#products">
              Explore Products →
            </a>
            <div className="trust">
              ✓ Easy shopping &nbsp; ✓ Great value
            </div>
          </div>

          <div className="hero-art">
            <div className="art-circle">
              <span>🛍️</span>
              <div className="floating-tag">Find your favourites ✨</div>
            </div>
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="section-heading">
            <div>
              <p className="eyebrow">HANDPICKED FOR YOU</p>
              <h2>Popular products</h2>
            </div>
            <span className="product-count">
              {products.length} products
            </span>
          </div>

          {products.length === 0 ? (
            <p>Loading products... If this continues, check the Product Service.</p>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image">{product.emoji}</div>
                  <div className="product-info">
                    <p className="category">{product.category}</p>
                    <h3>{product.name}</h3>
                    <div className="product-bottom">
                      <strong>
                        ₹{product.price.toLocaleString('en-IN')}
                      </strong>
                      <button
                        className="add-btn"
                        onClick={() => addToCart(product)}
                        aria-label={`Add ${product.name} to cart`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="cart-summary" id="cart">
          <h2>Your Shopping Cart</h2>

          {cart.length === 0 ? (
            <p>Your cart is empty. Add some products!</p>
          ) : (
            <>
             
        
{cart.map((item) => (
  <div className="cart-item" key={item.id}>
    <span>{item.name}</span>

    <div className="cart-controls">
      <button
        type="button"
        onClick={() => updateQuantity(item.id, -1)}
        aria-label={`Decrease ${item.name} quantity`}
      >
        −
      </button>

      <span>{item.quantity}</span>

      <button
        type="button"
        onClick={() => updateQuantity(item.id, 1)}
        aria-label={`Increase ${item.name} quantity`}
      >
        +
      </button>

      <strong>
        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
      </strong>

      <button
        type="button"
        onClick={() => removeFromCart(item.id)}
        aria-label={`Remove ${item.name} from cart`}
      >
        Remove
      </button>
    </div>
  </div>
))}

<div className="cart-total">
  <strong>
    Total: ₹{cartTotal.toLocaleString('en-IN')}
  </strong>
</div>
</>
)}
{cart.length > 0 && (
 <button
  type="button"
  className="checkout-btn"
  disabled={!token || cart.length === 0}
  onClick={async () => {
    if (!token || cart.length === 0) {
      setAuthMessage('Please log in before checkout.')
      setShowAuth(true)
      return
    }

    try {
      const response = await 
fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to place order.')
      }

      setCart([])
      localStorage.removeItem('shopsphere-cart')
      alert(`Order placed successfully! Order ID: ${data.order.id}`)
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      )
    }
  }}
>
  Proceed to Checkout
</button>
)}
</section>


        <section className="benefits" id="about">
          <div>
            <span>🚚</span>
            <strong>Convenient shopping</strong>
            <p>Browse products in one place.</p>
          </div>
          <div>
            <span>🔒</span>
            <strong>Security focused</strong>
            <p>Secure account authentication.</p>
          </div>
          <div>
            <span>💬</span>
            <strong>Customer support</strong>
            <p>Help when you need it.</p>
          </div>
        </section>
      </main>

      <footer>
        <a className="logo" href="#">
          Shop<span>Sphere</span>
        </a>
        <p>© 2026 ShopSphere. Built as an enterprise project.</p>
      </footer>
    </div>
  )
}

export default App
