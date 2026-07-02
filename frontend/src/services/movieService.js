import api from "../api/api";

export const getAllMovies = async () => {
  const response = await api.get("/movies");
  return response.data;
};

export const getMovieById = async (id) => {
  const response = await api.get(`/movies/${id}`);
  return response.data;
};