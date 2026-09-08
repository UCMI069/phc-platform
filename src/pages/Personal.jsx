import React from 'react';
import { Link } from 'react-router-dom';
import './Personal.css';

const Personal = () => {
  return (
    <div className="personal-page">
      <h1>Personal Banking</h1>
      <p>Welcome to PHC Personal Banking. Manage your accounts, apply for loans, and more.</p>
      <div className="personal-links">
        <Link to="/personal/accounts">Accounts</Link>
        <Link to="/personal/loans">Loans</Link>
        <Link to="/personal/mortgages">Mortgages</Link>
        <Link to="/personal/credit-cards">Credit Cards</Link>
        <Link to="/personal/investments">Investments</Link>
      </div>
    </div>
  );
};

export default Personal;