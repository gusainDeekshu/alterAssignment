
import './App.css'
import { HashRouter, Route, Routes } from 'react-router-dom'
import Landing from './components/Landing'
import Mainpage from './components/Mainpage'

function App() {
  

  return (
    
       <HashRouter>
        <Routes>
          <Route path='/' element={<Landing/>}/>
          <Route path='/main' element={<Mainpage/>}/>
        </Routes>
       </HashRouter>
        
  
  )
}

export default App
