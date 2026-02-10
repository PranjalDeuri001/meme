import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import propTypes from "prop-types";

const Logout = ({ onLogout }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.confirm("Are you sure you want to log out?")) {
      if (onLogout) {
        onLogout(); 
      }
      navigate("/login", { replace: true }); 
    }
  }, [onLogout, navigate]);

  return null;
};
Logout.propTypes = {
  onLogout: propTypes.func.isRequired,
};
      

export default Logout;
