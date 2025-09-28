const AUTH_URL = 'https://api.aipaa.ir/auth/token/';
const TTS_URL = 'https://api.aipaa.ir/api/v1/voice/tts-file-response/';

let cachedToken = null;
let tokenExpiry = 0;

const username = import.meta.env.VITE_TTS_USERNAME;
const password = import.meta.env.VITE_TTS_PASSWORD;
const clientId = import.meta.env.VITE_TTS_CLIENT_ID;

const ensureCredentials = () => {
  if (!username || !password || !clientId) {
    throw new Error('Missing TTS credentials');
  }
};

const requestToken = async () => {
  ensureCredentials();

  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      password,
      client_id: clientId,
      grant_type: 'password'
    })
  });

  if (!response.ok) {
    throw new Error(`Authentication failed with status ${response.status}`);
  }

  const data = await response.json();
  const token = data.access || data.access_token || data.token;
  const expiresIn = data.expires_in || data.expire_in || 300;

  if (!token) {
    throw new Error('Authentication response missing access token');
  }

  cachedToken = token;
  tokenExpiry = Date.now() + (expiresIn - 5) * 1000;
  return cachedToken;
};

const getToken = async () => {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  cachedToken = null;
  return requestToken();
};

const fetchSpeech = async (text, payload = {}) => {
  if (!text || !text.trim()) {
    throw new Error('No text provided for TTS');
  }

  const body = {
    text,
    ...payload
  };

  let token = await getToken();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (response.status === 401 && attempt === 0) {
      cachedToken = null;
      tokenExpiry = 0;
      token = await getToken();
      continue;
    }

    if (!response.ok) {
      throw new Error(`TTS request failed with status ${response.status}`);
    }

    return response.blob();
  }

  throw new Error('Unauthorized TTS request');
};

export default {
  fetchSpeech
};
