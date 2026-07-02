import api from "../api/api";

export const getAllShows = async () => {
  const response = await api.get("/shows");
  return response.data;
};

export const getShowById = async (id) => {
  const response = await api.get(`/shows/${id}`);
  return response.data;
};

export const getShowsByMovieId = async (movieId) => {
  const response = await api.get(`/shows/movie/${movieId}`);
  return response.data;
};