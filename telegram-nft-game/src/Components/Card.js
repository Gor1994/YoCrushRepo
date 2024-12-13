import React from "react";

const Card = ({ image, name }) => {
    return (
        <div className="card">
            <img src={image} alt={name} />
        </div>
    );
};

export default Card;
