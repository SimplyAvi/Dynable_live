import logo from './logo.svg';
import { Routes, Route} from 'react-router-dom'

// import Homepage from './pages/Homepage';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Dynable is now Eatems
        </p>
        <div>
          <Routes>
            {/* <Route exact path='/' Component={Homepage} /> */}
          </Routes>
        </div>
      </header>
    </div>
  );
}

export default App;
