import './App.css'
import React from 'react'
import Nav from './components/nav'
import { Route, Routes, useLocation } from "react-router-dom";
import Landing from './pages/landing';
import Analysis from './pages/Analysis';

function App() {
  return (
    <>
    {/* <Nav/> */}
    <Routes>
      <Route index path='/' element={<Landing/>}/>
      <Route path='/analysis' element={<Analysis/>}/>
      <Route path='/about' element={<h1>About Page</h1>}/>
      <Route path='/contact' element={<h1>Contact Page</h1>}/>
    </Routes>
    </>

  )
}

export default App
