import React, { useState } from "react";

const Card = ({ images, name, children, style, className }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className={`card ${className}`} style={style}>
      <h3>{name}</h3>
      <div className="slider">
        {images.length > 1 && (
          <button className="prev" onClick={handlePrev}>
            &#9664;
          </button>
        )}
        <img src={images[currentIndex]} alt={`${name} - ${currentIndex + 1}`} />
        {images.length > 1 && (
          <button className="next" onClick={handleNext}>
            &#9654;
          </button>
        )}
      </div>
      {children}
    </div>
  );
};

export default Card;
