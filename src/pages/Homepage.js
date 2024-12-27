import React from 'react'
import SearchAndFilter from '../components/SearchAndFilter/SearchAndFilter'
import AllergyFilter from '../components/AllergyFilter/AllergyFilter'
import ShowResults from '../components/ShowResults'
import { useSelector } from 'react-redux'
import './HomePage.css'

const HomePage = () => {
    const products = useSelector((state)=>state.products.productsResults)

    return (
        <div className="homepage-container">
            <header className="homepage-header">
                <div className="dynable-button">
                    {/* Your dynable home button */}
                </div>
                <SearchAndFilter />
            </header>

            <main className="homepage-main">
               

                <section className="results-section">
                    <ShowResults />
                </section>
            </main>

            <footer className="homepage-footer">
                <div className="feedback-button">
                    {/* Your feedback button */}
                </div>
            </footer>
        </div>
    )
}

export default HomePage