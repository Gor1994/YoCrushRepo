import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css"; 
import "swiper/css/navigation";
import "swiper/css/pagination";
import "../styles/card.css";

const Card = ({ images, name, children, isSingle = false }) => {
  return (
    <div className={isSingle ? "card single-card" : "card"}>
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
