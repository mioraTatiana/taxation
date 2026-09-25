import { useState } from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from "./Page composants/Pages communs/Login/Login"


function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;


