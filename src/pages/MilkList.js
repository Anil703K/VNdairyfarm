import React from 'react';
import MilkCard from './MilkCard';
import MilkApi from '../services/MilkApi';
import buffalomilk from '../images/buffalomilk.png';
import cowmilk from '../images/cowmilk.png';
import milkpowder from '../images/milkpowder.png';
const imageMap = {
  'buffalomilk.png': buffalomilk,
  'cowmilk.png': cowmilk,
  'milkpowder.png': milkpowder,
  
};

const MilkList = () => {
  return (
    <>
    <h1>Fresh milk</h1>
    <div className='products-list'>
      {MilkApi.map((product) => {
        const imgKey = product.image.replace(/^.*[\\/]/, '').toLowerCase();
        const img = imageMap[imgKey] || imageMap[product.image.replace(/^.*[\\/]/, '')] || imageMap[product.image] || product.image;
        if (!imageMap[imgKey]) {
          return (
            <div key={product.id} style={{border: '1px solid red', padding: 10, margin: 10, color: 'red'}}>
              <div>Image not found for: <b>{imgKey}</b> (original: {product.image})</div>
              <MilkCard
                milk={{
                  ...product,
                  image: ''
                }}
              />
            </div>
         
          );
        }
        return (
          <MilkCard
            key={product.id}
            milk={{
              ...product,
              image: img
            }}
          />
        );
      })}
    </div>
    </>
  );
};

export default MilkList;
