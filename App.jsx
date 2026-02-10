import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, setCredentials, logOut } from "./store/authSlice";
import { apiSlice } from "./store/apiSlice";
import Sidebar from "./Components/Sidebar/Sidebar.jsx";
import Topnav from "./Components/Topnav/Topnav.jsx";
import Login from "./Components/Login/Login.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { saveVehicles } from "./Data/data.jsx";
import Content from "./Components/Content/Content.jsx";

// --- UPDATED: Import both default avatar assets ---
import avatar1 from "@/Assets/Eka_Avatars/AV1.png";
import avatar2 from "@/Assets/Eka_Avatars/AV2.png";

// --- NEW: 1. Import the Diwali component ---
// import Diwali from "./Components/Diwali/Diwali.jsx";

const App = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [hoverEnabled, setHoverEnabled] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userInfo = useSelector(selectCurrentUser);

  const handleLogout = useCallback(() => {
    dispatch(logOut());
    dispatch(apiSlice.util.resetApiState());
    localStorage.clear();
    navigate("/login");
  }, [dispatch, navigate]);

  useEffect(() => {
    const storedBuildVersion = localStorage.getItem("buildVersion");
    if (userInfo && storedBuildVersion) {
      const { timestamp } = JSON.parse(storedBuildVersion);
      const buildTime = new Date(timestamp);
      if (new Date() - buildTime > 48 * 60 * 60 * 1000) {
        handleLogout();
      }
    } else if (!userInfo && window.location.pathname !== "/login") {
      navigate("/login");
    }
  }, [handleLogout, navigate, userInfo]);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      document.body.style.overflow = !collapsed ? "hidden" : "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [collapsed]);

  const handleLoginSuccess = (userData) => {
    let normalizedUser = {
      ...userData,
      name: userData.name || userData.username,
      email: userData.email || userData.username,
      avatar: userData.avatar || null,
    };

    // --- TEMPORARY FEATURE: Set default avatar for specific users ---
    if (
      normalizedUser.email === "sudhir.m@ekamobility.com" &&
      !normalizedUser.avatar
    ) {
      normalizedUser.avatar = avatar1;
      normalizedUser.avatarId = "av1";
    }
    // --- NEW: Added rule for the new user ---
    else if (
      normalizedUser.email === "shannu@gmail.com" &&
      !normalizedUser.avatar
    ) {
      normalizedUser.avatar = avatar2;
      normalizedUser.avatarId = "av2";
    }
    // --- END OF TEMPORARY FEATURE ---

    dispatch(setCredentials(normalizedUser));
    localStorage.setItem(
      "buildVersion",
      JSON.stringify({ timestamp: new Date() })
    );
    const lastVisitedRoute =
      localStorage.getItem("lastVisitedRoute") || "/home";
    navigate(lastVisitedRoute);
  };

  useEffect(() => {
    saveVehicles([]);
  }, []);

  const handleToggle = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    setHoverEnabled(newCollapsed);
  };

  const handleSidebarItemClick = () => {
    if (window.innerWidth <= 768) {
      setCollapsed(true);
    }
  };

  const lastVisitedRoute = localStorage.getItem("lastVisitedRoute") || "/home";
  const isAuthenticated = !!userInfo;

  return (
    <div className={`App ${collapsed ? "sidebar-collapsed" : ""}`}>
      {isAuthenticated ? (
        <>
          <Topnav
            onLogout={handleLogout}
            userInfo={userInfo}
            onToggle={handleToggle}
          />
          <Sidebar
            userInfo={userInfo}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            hoverEnabled={hoverEnabled}
            className={collapsed ? "collapsed" : ""}
            onItemClick={handleSidebarItemClick}
          />
          <Content
            userInfo={userInfo}
            handleLogout={handleLogout}
            lastVisitedRoute={lastVisitedRoute}
          />
          {/* --- NEW: 2. Add the Diwali component here --- */}
          {/* <Diwali /> */}
        </>
      ) : (
        <Routes>
          <Route
            path="/login"
            element={<Login onLoginSuccess={handleLoginSuccess} />}
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </div>
  );
};

export default App;
