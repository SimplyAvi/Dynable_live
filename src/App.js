import { Routes, Route} from 'react-router-dom'

import Homepage from './pages/Homepage';
import './App.css';
import ProductPage from './pages/ProductPage/ProductPage';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Dynable is now Eatems
        </p>
        <div>
          <Routes>
            <Route exact path='/' Component={Homepage} />
            <Route path='/product/:id' Component={ProductPage} />
          </Routes>
        </div>
      </header>
    </div>
  );
}

export default App;
