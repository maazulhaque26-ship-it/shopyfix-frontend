import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { cartReducer, wishlistReducer, productsReducer } from './slices/shopSlices';

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    products: productsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;