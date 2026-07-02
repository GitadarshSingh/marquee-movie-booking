import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getShowsByMovieId } from "../services/showService";

function ShowSelection() {
  const { movieId, theaterId } = useParams();
  const navigate = useNavigate();

  const [shows, setShows] = useState([]);

  useEffect(() => {
    loadShows();
  }, [movieId, theaterId]);

  const loadShows = async () => {
    try {
      const data = await getShowsByMovieId(movieId);

      const filtered = data.filter(
        (show) =>
          Number(show.screen?.theater?.id) === Number(theaterId)
      );

      setShows(filtered);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Select Show</h1>

      {shows.map((show) => (
        <div
          key={show.id}
          onClick={() => navigate(`/shows/${show.id}/seats`)}
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginTop: "20px",
            borderRadius: "10px",
            cursor: "pointer"
          }}
        >
          <h2>
            {new Date(show.startTime).toLocaleTimeString()}
          </h2>

          <p>Screen: {show.screen.name}</p>

          <p>Theater: {show.screen.theater.name}</p>
        </div>
      ))}
    </div>
  );
}

export default ShowSelection;