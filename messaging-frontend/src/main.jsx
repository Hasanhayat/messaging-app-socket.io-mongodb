import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router";
import ContextProvider from "./context/Context.jsx";
import { SnackbarProvider } from "notistack";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ContextProvider>
      <SnackbarProvider
        maxSnack={7}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <App />
      </SnackbarProvider>
    </ContextProvider>
  </BrowserRouter>
);
