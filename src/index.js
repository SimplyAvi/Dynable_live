/**
 * Application Entry Point
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * Main application setup:
 * - Redux store configuration
 * - React Router setup
 * - Cookie provider for auth
 * - Performance monitoring
 * 
 * Dependencies:
 * - Redux for state management
 * - React Router for navigation
 * - React Cookie for auth tokens
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import store, { persistor } from './redux/store'
import { Provider } from 'react-redux'
import { CookiesProvider } from 'react-cookie';
import { PersistGate } from 'redux-persist/integration/react';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <CookiesProvider>
          <App />
        </CookiesProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
