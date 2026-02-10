import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./Content.css";
import PropTypes from "prop-types";
import { allRoutes } from "../../routesConfig.jsx";

const Logout = lazy(() => import("../../Pages/Logout/logout.jsx"));
const Setting = lazy(() => import("../../Pages/Settings/Settings.jsx"));
const Loader = () => (
  <div className="loader-container">
    <div className="loader" />
  </div>
);

function Content({ userInfo, handleLogout, lastVisitedRoute }) {
  const location = useLocation();

  useEffect(() => {
    if (userInfo) {
      localStorage.setItem("lastVisitedRoute", location.pathname);
    }
  }, [location.pathname, userInfo]);

  // Safely get the user's allowed features
  const allowedFeatures =
    userInfo?.subscription?.features?.["EKA Dashboard"] || [];
  const allowedFeaturesSet = new Set(allowedFeatures);

  // Filter routes config to get only accessible routes
  const accessibleRoutes = allRoutes.filter(
    (route) => route.alwaysVisible || allowedFeaturesSet.has(route.featureName)
  );

  return (
    <div className="content">
      <Routes>
        {userInfo ? (
          <>
            {/* Render routes based on user permissions */}
            {accessibleRoutes.map(({ path, component }) => (
              <Route
                key={path}
                path={path}
                element={
                  <Suspense fallback={<Loader />}>
                    {component}
                  </Suspense>
                }
              />
            ))}

            {/* Manually add routes with parameters */}
            <Route
              path="/settings/:section?"
              element={
                <Suspense fallback={<Loader />}>
                  <Setting />
                </Suspense>
              }
            />

            {/* Standard routes for logged-in users */}
            <Route
              path="/logout"
              element={
                <Suspense fallback={<Loader />}>
                  <Logout onLogout={handleLogout} />
                </Suspense>
              }
            />
            <Route path="/" element={<Navigate to="/home" />} />
            <Route
              path="*"
              element={<Navigate to={lastVisitedRoute || "/home"} />}
            />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </div>
  );
}

Content.propTypes = {
  userInfo: PropTypes.object,
  handleLogout: PropTypes.func.isRequired,
  lastVisitedRoute: PropTypes.string,
};

Content.defaultProps = {
  userInfo: null,
  lastVisitedRoute: "/home",
};

export default Content;
