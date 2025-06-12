/**
 * Google Authentication Implementation
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * Header component with authentication-aware navigation:
 * - Dynamic navigation based on auth state
 * - Welcome message for authenticated users
 * - Login/Signup buttons for guests
 * - Profile access for authenticated users
 * - Dynable logo with home navigation
 * - Logout functionality for authenticated users
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { selectIsAuthenticated, selectCurrentUser, logout } from '../../redux/authSlice'
import './Header.css'

const Header = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const isAuthenticated = useSelector((state) => selectIsAuthenticated(state))
    const user = useSelector((state) => selectCurrentUser(state))

    const handleLogout = () => {
        // Clear local storage
        localStorage.removeItem('token')
        // Dispatch logout action
        dispatch(logout())
        // Navigate to home page
        navigate('/')
    }

    return (
        <header className="header">
            <div className="header-left">
                <div className="dynable-logo" onClick={() => navigate('/')}>
                    <span className="logo-text">Dynable</span>
                </div>
            </div>
            <div className="header-right">
                {isAuthenticated ? (
                    <>
                        <span className="welcome-text">Welcome, {user?.name || user?.email}</span>
                        <button className="nav-button" onClick={() => navigate('/profile')}>
                            Profile
                        </button>
                        <button className="nav-button logout" onClick={handleLogout}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <button className="nav-button" onClick={() => navigate('/login')}>
                            Login
                        </button>
                        <button className="nav-button" onClick={() => navigate('/signup')}>
                            Sign Up
                        </button>
                    </>
                )}
            </div>
        </header>
    )
}

export default Header