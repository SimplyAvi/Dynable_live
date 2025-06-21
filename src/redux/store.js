import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './reducers';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage

// Only persist the cart slice (for anonymous users)
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['cart'], // Only persist cart
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

// --- IMPORTANT ---
// After a user logs in (in GoogleCallback.js or Login.js), call persistor.purge()
// to clear any persisted cart state and ensure Redux is hydrated from backend only.
// Example:
//   import { persistor } from '../../redux/store';
//   persistor.purge();
// -----------------

export default store;