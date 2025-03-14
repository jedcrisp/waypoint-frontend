const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const formData = new FormData();
formData.append("file", selectedFile);

const response = await fetch(`${API_URL}/upload-csv/adp`, {
  method: "POST",
  body: formData,
});
const data = await response.json();
console.log(data);

