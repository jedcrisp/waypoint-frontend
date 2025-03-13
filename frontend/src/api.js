const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL; // ✅ Uses Railway backend URL

export async function fetchData() {
  const response = await fetch(`${API_URL}/your-endpoint`);
  const data = await response.json();
  return data;
}
