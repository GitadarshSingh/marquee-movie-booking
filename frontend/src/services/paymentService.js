import api from "../api/api";

// Create Razorpay order
export const createOrder = async (paymentData) => {
  const response = await api.post("/payments/create-orders", paymentData);
  
  // Backend returns String, axios may or may not auto-parse it
  return typeof response.data === "string"
    ? JSON.parse(response.data)  // string → parse to object
    : response.data;             // already object → use directly
};

// Send signature for verification (not status string)
export const updateOrderStatus = async (orderId, paymentId, signature) => {
  const response = await api.post(
    `/payments/update-orders?orderId=${orderId}&paymentId=${paymentId}&signature=${signature}`
  );
  return response.data;
};

// Handle failed payments → releases seats
export const paymentFailed = async (orderId) => {
  const response = await api.post(
    `/payments/payment-failed?orderId=${orderId}`
  );
  return response.data;
};