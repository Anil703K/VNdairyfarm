import React from 'react'
import './App.css'  
import Header from './Components/Header'
import Mainbody from './Components/Mainbody'
import ProductsList from './Components/Products/ProductsList'
import {Routes,Route} from 'react-router-dom';
import ProductList from './pages/ProductList'
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import OrderTracking from './pages/OrderTracking';
import Orders from './pages/Orders';
import Payment from './pages/Payment';
import CopyRights from './Components/CopyRights'
import { ToastProvider } from './context/ToastContext'

function App() {
  return (
    <ToastProvider>
      <div>
        <Header/>
        <Routes>
          <Route path='/' element={<>
           <Mainbody/>
          <ProductsList/>
          <CopyRights/>
          </>}/>
          <Route path='/MilkList' element={<ProductList/>}/>
          <Route path='/About' element={<About/>}/>
          <Route path='/Contact' element={<Contact/>}/>
          <Route path='/login' element={<Login/>}/>
          <Route path='/register' element={<Register/>}/>
          <Route path='/profile' element={<Profile/>}/>
          <Route path='/orders' element={<Orders/>}/>
          <Route path='/cart' element={<Cart/>}/>
          <Route path='/payment' element={<Payment/>}/>
          <Route path='/order-tracking/:orderId' element={<OrderTracking/>}/>
        </Routes>
       
        </div>
    </ToastProvider>
  )
}

export default App
