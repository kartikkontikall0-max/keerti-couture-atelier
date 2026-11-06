// Centralized API base URL for all frontend fetch calls.
// Set NEXT_PUBLIC_API_URL in .env.local for local dev or in your deployment env for production.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export default API_URL;
