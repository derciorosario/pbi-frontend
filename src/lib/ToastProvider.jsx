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
          style: { fontSize: "14px" },
          success: { iconTheme: { primary: "#8A358A", secondary: "#fff" } }
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
      style={{ fontSize: "14px" }}
    />
  );
}
