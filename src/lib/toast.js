// Flip this to "hot" or "notify"
export const TOAST_LIB = "hot"; // "hot" | "notify"

import hot from "react-hot-toast";
import { toast as notify } from "react-toastify";

/** Unify API across both libs */
export const toast = {
  success: (msg, opts) => (TOAST_LIB === "hot" ? hot.success(msg, opts) : notify.success(msg, opts)),
  error:   (msg, opts) => (TOAST_LIB === "hot" ? hot.error(msg, opts)   : notify.error(msg, opts)),
  loading: (msg, opts) => (TOAST_LIB === "hot" ? hot.loading(msg, opts) : notify.info(msg, { autoClose: false, ...opts })),
  dismiss: (id)        => (TOAST_LIB === "hot" ? hot.dismiss(id)        : notify.dismiss(id)),
  promise: (promise, msgs, opts) => {
    if (TOAST_LIB === "hot") {
      return hot.promise(promise, msgs, opts);
    }
    // react-toastify also supports toast.promise
    return notify.promise(promise, msgs, opts);
  }
};
