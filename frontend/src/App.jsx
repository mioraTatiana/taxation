import { useState } from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from "./Page composants/Pages communs/Login/Login"
import CreeCompte from './Page composants/Pages communs/CreerCompte/Creercompte';


function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path='/creercompte' element={<CreeCompte/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;


