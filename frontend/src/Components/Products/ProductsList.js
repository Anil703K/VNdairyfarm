import React from 'react'
import './ProductsList.css';
import ProductsCard from './ProductsCard';
import products from '../../services/ApisData';
import { resolveProductImage } from '../../services/imageHelper';

const ProductsList = () => {
  return (
    <div className='products-list'>
      {products.map((product) => (
        <ProductsCard
          key={product.id}
          product={{
            ...product,
            image: resolveProductImage(product.image) || product.image
          }}
        />
      ))}
    </div>
  );
};

export default ProductsList
