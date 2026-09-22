import React from 'react'
import Creercompte from '../Creercompte'

const creercompteSU = () => {
  return (
    <div className='creerCompteSU' style={{position:'relative', top: '40px'}}>
      <Creercompte  statusUser="non-active" roleUser='simple utilisateur' />
    </div>
  )
}

export default creercompteSU
