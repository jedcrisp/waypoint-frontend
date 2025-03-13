const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function fetchData(endpoint) {
  const response = await fetch(`${API_URL}/${endpoint}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
}
