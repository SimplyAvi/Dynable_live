import React from 'react'
import SearchAndFilter from '../components/SearchAndFilter/SearchAndFilter'
import ShowResults from '../components/ShowResults'
import './Homepage.css'

const Homepage = () => {
    return (
        <div className="homepage">
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