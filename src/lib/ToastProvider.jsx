import React from "react";
import { TOAST_LIB } from "./toast";

// hot
import { Toaster } from "react-hot-toast";

// notify
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  if (TOAST_LIB === "hot") {
    return (
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontSize: "14px" ,zIndex:9999999},
          success: { iconTheme: { primary: "#0a66c2", secondary: "#fff" } }
        }}
      />
    );
  }
  return (
    <ToastContainer
      position="bottom-right"
      transition={Slide}
      pauseOnHover
      closeOnClick
      newestOnTop
      theme="light"
      style={{ fontSize: "14px",zIndex:9999999 }}
    />
  );
}
