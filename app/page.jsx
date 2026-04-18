import { redirect } from 'next/navigation'

// Middleware handles the redirect logic;
// this page is only reached if middleware is bypassed.
export default function Home() {
  redirect('/login')
}
