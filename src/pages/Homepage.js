import React from 'react'
import Header from '../components/Header/Header'
import SearchAndFilter from '../components/SearchAndFilter/SearchAndFilter'
import ShowResults from '../components/ShowResults'
import './HomePage.css'

const Homepage = () => {
    return (
        <div className="homepage">
            <Header />
            <div className="content-wrapper">
                <SearchAndFilter />
                <ShowResults />
              
            </div>
            <footer className="homepage-footer">
                <span className="copyright">© 2025 Dynable. All rights reserved.</span>
            </footer>
        </div>
    )
}

export default Homepage