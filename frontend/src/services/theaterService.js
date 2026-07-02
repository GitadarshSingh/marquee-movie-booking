import api from "../api/api";

export const getAllTheaters = async () => {
  const response = await api.get("/theaters");
  return response.data;
};

export const getTheaterById = async (id) => {
  const response = await api.get(`/theaters/${id}`);
  return response.data;
};

export const getTheatersByCity = async (city) => {
  const response = await api.get(`/theaters/city/${city}`);
  return response.data;
};