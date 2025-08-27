import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://chat.vinagpu.com';

export const uploadFile = async (file: File) => {
  const token = Cookies.get('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    }
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
};
