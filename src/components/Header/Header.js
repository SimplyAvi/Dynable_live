import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Header.css'

const Header = () => {
    const navigate = useNavigate()

    return (
        <div className="dynable-logo" onClick={() => navigate('/')}>
            <span className="logo-text">Dynable</span>
        </div>
    )
}

export default Header