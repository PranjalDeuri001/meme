import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import "antd/dist/reset.css";
import { MantineProvider } from "@mantine/core";
import { ChargingProvider } from "./context/ChargingContext";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

import "bootstrap/dist/css/bootstrap.min.css";
import App from "./App";
import "./i18n";
import "./index.css";
import store from "./store/store";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <MantineProvider>
      <ChargingProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ChargingProvider>
    </MantineProvider>
  </Provider>
);
