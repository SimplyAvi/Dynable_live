import { Routes, Route} from 'react-router-dom'

import Homepage from './pages/HomePage';
import './App.css';
import ProductPage from './pages/ProductPage/ProductPage';
import RecipePage from './pages/RecipePage/RecipePage';
import foodCategoryTable from './pages/Catagory_Testing/CatagoryPage';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div>
          <Routes>
            <Route exact path='/' Component={Homepage} />
            <Route path='/product/:id' Component={ProductPage} />
            <Route path='/recipe/:id' Component={RecipePage} />
            <Route path='/catagories' Component={foodCategoryTable} />
          </Routes>
        </div>
      </header>
    </div>
  );
}

export default App;
