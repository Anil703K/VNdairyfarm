import React from 'react'
import './App.css'  
import Header from './Components/Header'
import Mainbody from './Components/Mainbody'
import ProductsList from './Components/Products/ProductsList'
import {Routes,Route} from 'react-router-dom';
import MilkList from './pages/MilkList'
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import CopyRights from './Components/CopyRights'

function App() {
  return (
    <div>
      <Header/>
 
      <Routes>
        <Route path='/' element={<>
         <Mainbody/>
        <ProductsList/>
        <CopyRights/>
        </>}/>
        <Route path='/MilkList' element={<MilkList/>}/>
        <Route path='/About' element={<About/>}/>
        <Route path='/Contact' element={<Contact/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/register' element={<Register/>}/>
      </Routes>
     
      </div>
  )
}

export default App
