import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules"; // Correct modular imports
import "swiper/css"; // Main Swiper styles
import "swiper/css/navigation"; // Navigation module styles
import "swiper/css/pagination"; // Pagination module styles
import "../styles/card.css"


const Card = ({ images, name, children }) => {
  return (
    <div className="card">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000 }}
        loop
        className="card-slider"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <img src={image} alt={name} className="card-image" />
          </SwiperSlide>
        ))}
      </Swiper>
      <h3>{name}</h3>
      <div className="card-children">{children}</div>
    </div>
  );
};

export default Card;
