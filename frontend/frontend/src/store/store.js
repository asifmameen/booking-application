import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import productsReducer from './productsSlice';
import bookingReducer from './bookingSlice';

export default configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    booking: bookingReducer
  }
});
