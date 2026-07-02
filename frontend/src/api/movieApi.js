import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api";

export const getAllMovies = async () => {
  const response = await axios.get(`${API_BASE_URL}/movies`);
  return response.data;
};