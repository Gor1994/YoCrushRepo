import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css"; 
import "swiper/css/navigation";
import "swiper/css/pagination";
import "../styles/card.css";

const Card = ({ id, images, name, children, isSingle = false }) => {
  console.log(id)  
  const numericId = Number(id) || 0; // Ensure id is a number, default to 0 if undefined or NaN
  const delay = 3000 + numericId * 500;
  return (
    <div className={isSingle ? "card single-card" : "card"}>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={delay}
        loop
        className="card-slider"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <img src={image.replace("ipfs://", "https://ipfs.bahamut.io/ipfs/")} alt={name} className="card-image" />
          </SwiperSlide>
        ))}
      </Swiper>
      <h3>{name}</h3>
      <div className="card-children">{children}</div>
    </div>
  );
};

export default Card;
