import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";
import EkaConnect from "../../Assets/LOGO'S/EkaConnectLogo_White.png";
import PropTypes from "prop-types";

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const backendUrl = import.meta.env.VITE_API_URL_3;

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    // --- Real API Authentication ---
    fetch(`${backendUrl}/users/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errData = await response
            .json()
            .catch(() => ({ detail: "An unknown error occurred." }));
          throw new Error(errData.detail || "Invalid user name or password");
        }
        return response.json();
      })
      .then((data) => {
        if (data.user_id && data.username) {
          setMessage("Login Successful!");
          onLoginSuccess(data);
        } else {
          setMessage(
            data.message || "Error: Login failed. Please check credentials."
          );
        }
      })
      .catch((error) => {
        console.error("Login Error:", error);
        setMessage(`Error: ${error.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="Login-Page">
      <div className="login-container">
        <Form onSubmit={handleLogin} id="Login-Form" autoComplete="on">
          <img src={EkaConnect} alt="Eka Connect" className="eka-logo" />
          <Form.Group className="Login-TextField">
            <Form.Label className="Login-Input-Title">User Name</Form.Label>
            <Form.Control
              type="text"
              name="username"
              className="Login-InputFields"
              placeholder="Enter User Name"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </Form.Group>
          <Form.Group className="Login-TextField">
            <Form.Label className="Login-Input-Title">Password</Form.Label>
            <div className="password-input">
              <Form.Control
                type={passwordVisible ? "text" : "password"}
                name="password"
                className="Login-InputFields"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-icon"
                onClick={togglePasswordVisibility}
                aria-label="Toggle password visibility"
              >
                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </Form.Group>
          <Form.Check
            type="checkbox"
            className="Login-CheckBox"
            label="Remember Me"
          />
          <Button
            // variant="primary"
            type="submit"
            className="Login-Submit"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
          {message && <p id="Login-Error">{message}</p>}
        </Form>
      </div>
    </div>
  );
};

Login.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
};

export default Login;
