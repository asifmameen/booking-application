import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

export const bookProduct = createAsyncThunk('booking/book', async ({ product_id, quantity }, { getState }) => {
  const token = getState().auth.token;
  const res = await api.post('/book', { product_id, quantity }, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
});

const slice = createSlice({
  name: 'booking',
  initialState: { status: 'idle', result: null, error: null },
  reducers: { clear: (s) => { s.status='idle'; s.result=null; s.error=null; } },
  extraReducers: (b) => {
    b.addCase(bookProduct.pending, (s) => { s.status='loading'; })
     .addCase(bookProduct.fulfilled, (s, a) => { s.status='succeeded'; s.result = a.payload; })
     .addCase(bookProduct.rejected, (s, a) => { s.status='failed'; s.error = a.error.message; });
  }
});

export const { clear } = slice.actions;
export default slice.reducer;
