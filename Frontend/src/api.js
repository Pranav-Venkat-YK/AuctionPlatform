// Shared API utilities

const BASE_USER    = '/users';
const BASE_AUCTION = '/auctions';
const BASE_BIDDING = '/bids';    // proxy to bidding service

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  let data;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const msg = (typeof data === 'object' && data)
      ? data.message || data.error || JSON.stringify(data)
      : data || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function auth(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---- User Service ----
export const userApi = {
  register: (body) => request(`${BASE_USER}/register`, { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request(`${BASE_USER}/login`,    { method: 'POST', body: JSON.stringify(body) }),
  getUser:  (id, token) => request(`${BASE_USER}/${id}`, { headers: auth(token) }),
  updateUser: (id, body, token) => request(`${BASE_USER}/${id}`, { method: 'PUT', headers: auth(token), body: JSON.stringify(body) }),
};

// ---- Auction Service ----
export const auctionApi = {
  list:   (params = {}, token) => {
    const qs = new URLSearchParams(params).toString();
    return request(`${BASE_AUCTION}${qs ? '?' + qs : ''}`, { headers: auth(token) });
  },
  get:    (id, token) => request(`${BASE_AUCTION}/${id}`, { headers: auth(token) }),
  create: (body, token) => request(`${BASE_AUCTION}`, { method: 'POST', headers: auth(token), body: JSON.stringify(body) }),
  bySeller: (sellerId, params = {}, token) => {
    const qs = new URLSearchParams(params).toString();
    return request(`${BASE_AUCTION}/seller/${sellerId}${qs ? '?' + qs : ''}`, { headers: auth(token) });
  },
};

// ---- Bidding Service ----
export const bidApi = {
  place:      (auctionId, body, token) => request(`${BASE_AUCTION}/${auctionId}/bids`, { method: 'POST', headers: auth(token), body: JSON.stringify(body) }),
  highest:    (auctionId, token)       => request(`${BASE_AUCTION}/${auctionId}/highest-bid`, { headers: auth(token) }),
  history:    (auctionId, params = {}, token) => {
    const qs = new URLSearchParams(params).toString();
    return request(`${BASE_AUCTION}/${auctionId}/bids${qs ? '?' + qs : ''}`, { headers: auth(token) });
  },
};

