import React from 'react';
import Hero from '../components/Hero';
import ProductsServices from '../components/ProductsServices';
import InvestmentOffer from '../components/InvestmentOffer';
import MobileApp from '../components/MobileApp';
import MoreFromPHC from '../components/MoreFromPHC';
import Reviews from '../components/Reviews';

const Home = () => {
  return (
    <main id="main-content">
      <Hero />
      <ProductsServices />
      <InvestmentOffer />
      <Reviews />
      <MobileApp />
      <MoreFromPHC />
    </main>
  );
};

export default Home;
