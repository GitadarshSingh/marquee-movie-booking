import api from "../api/api";

export const getSeatsByShowId = async (showId) => {
  const response = await api.get(
    `/show-seats/show/${showId}`
  );

  return response.data;
};