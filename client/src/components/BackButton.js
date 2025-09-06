import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const BackButton = ({ className = '', text = 'Geri', fallbackPath = '/' }) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    // Önce browser history'yi kontrol et
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Eğer history yoksa fallback path'e git
      navigate(fallbackPath);
    }
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
