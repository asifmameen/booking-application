import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

export const fetchProducts = createAsyncThunk('products/fetch', async (params) => {
  const res = await api.get('/products', { params });
  return res.data.products;
});

const slice = createSlice({
  name: 'products',
  initialState: { list: [], status: 'idle', error: null, filters: {} },
  reducers: {
    setFilters: (s, a) => { s.filters = { ...s.filters, ...a.payload }; }
  },
  extraReducers: (b) => {
    b.addCase(fetchProducts.pending, (s) => { s.status = 'loading'; })
     .addCase(fetchProducts.fulfilled, (s, a) => { s.status = 'succeeded'; s.list = a.payload; })
     .addCase(fetchProducts.rejected, (s, a) => { s.status = 'failed'; s.error = a.error.message; });
  }
});

export const { setFilters } = slice.actions;
export default slice.reducer;
