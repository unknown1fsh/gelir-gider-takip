import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const BackButton = ({ className = '', text = 'Geri' }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <button
      onClick={handleGoBack}
      className={`btn btn-outline-secondary back-button ${className}`}
      type="button"
    >
      <FaArrowLeft className="me-2" />
      {text}
    </button>
  );
};

export default BackButton;
