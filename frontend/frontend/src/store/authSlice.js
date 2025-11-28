import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

export const login = createAsyncThunk('auth/login', async ({ username, password }) => {
  const res = await api.post('/login', { username, password });
  return res.data;
});

const slice = createSlice({
  name: 'auth',
  initialState: { token: null, user: null, status: 'idle', error: null },
  reducers: { logout: (s) => { s.token = null; s.user = null; } },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.status = 'loading'; })
     .addCase(login.fulfilled, (s, a) => { s.status = 'succeeded'; s.token = a.payload.token; })
     .addCase(login.rejected, (s, a) => { s.status = 'failed'; s.error = a.error.message; });
  }
});

export const { logout } = slice.actions;
export default slice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

export const login = createAsyncThunk('auth/login', async ({ username, password }) => {
  const res = await api.post('/login', { username, password });
  return res.data;
});

const slice = createSlice({
  name: 'auth',
  initialState: { token: null, user: null, status: 'idle', error: null },
  reducers: { logout: (s) => { s.token = null; s.user = null; } },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.status = 'loading'; })
     .addCase(login.fulfilled, (s, a) => { s.status = 'succeeded'; s.token = a.payload.token; })
     .addCase(login.rejected, (s, a) => { s.status = 'failed'; s.error = a.error.message; });
  }
});

export const { logout } = slice.actions;
export default slice.reducer;
