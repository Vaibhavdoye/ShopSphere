export type Product = {
  id: number
  name: string
  category: string
  price: number
}

export const products: Product[] = [
  { id: 1, name: 'Wireless Headphones', category: 'Electronics', price: 1499 },
  { id: 2, name: 'Smart Watch', category: 'Accessories', price: 2199 },
  { id: 3, name: 'Everyday Backpack', category: 'Lifestyle', price: 999 },
  { id: 4, name: 'Running Sneakers', category: 'Fashion', price: 1799 },
]