import api from "../api/api";

export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const signup = async (name, email, password, phoneNumber) => {
  const response = await api.post("/auth/signup", {
    name,
    email,
    password,
    phoneNumber,
  });
  return response.data;
};