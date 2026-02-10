// src/Components/common/Button.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './Button.css'; // Import the button-specific styles

const Button = ({ children, onClick, variant = 'primary', type = 'button', disabled = false, className = '' }) => {
  // Combine the base class, the variant class, and any extra classes
  const buttonClassName = `btn btn-${variant} ${className}`;

  return (
    <button
      type={type}
      className={buttonClassName}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default Button;