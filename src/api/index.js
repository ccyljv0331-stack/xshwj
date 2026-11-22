import { getToken, clearAuth } from '../utils/auth';

async function request(action, { method = 'GET', params = {}, body } = {}) {
  const url = new URL('/api/db', window.location.origin);
  url.searchParams.set('action', action);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('网络连接失败，请检查网络后重试');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) clearAuth();
    const error = new Error(data.error || `请求失败（${response.status}）`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  getHome: () => request('home'),
  listDocs: (params) => request('docs', { params }),
  getDoc: (id) => request('doc', { params: { id } }),
  increaseView: (id) => request('view', { method: 'POST', body: { id } }),

  // 上传文件到 FileBrowser（multipart，走服务端代理）
  uploadFile: async (file) => {
    const url = new URL('/api/db', window.location.origin);
    url.searchParams.set('action', 'upload');

    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
      response = await fetch(url, { method: 'POST', headers, body: formData });
    } catch {
      throw new Error('上传失败，请检查网络后重试');
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) clearAuth();
      const error = new Error(data.error || `上传失败（${response.status}）`);
      error.status = response.status;
      throw error;
    }
    return data;
  },
  login: (username, password) =>
    request('login', { method: 'POST', body: { username, password } }),

  createDoc: (payload) => request('create', { method: 'POST', body: payload }),
  updateDoc: (payload) => request('update', { method: 'POST', body: payload }),
  deleteDoc: (id) => request('delete', { method: 'POST', body: { id } }),

  listAdmins: () => request('admins'),
  createAdmin: (payload) => request('admin-create', { method: 'POST', body: payload }),
  deleteAdmin: (id) => request('admin-delete', { method: 'POST', body: { id } }),
};
