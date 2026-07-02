import { useNavigate } from "react-router-dom";

function MovieCard({ movie }) {
  const navigate = useNavigate();

  return (
    <div className="movie-card" onClick={() => navigate(`/movie/${movie.id}`)}>
      <div className="movie-poster-wrapper">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="movie-poster"
          onError={(e) => {
            e.target.src = `https://placehold.co/200x300/1a1a2e/ffffff?text=${encodeURIComponent(movie.title)}`;
          }}
        />
        <div className="movie-overlay">
          <button className="book-btn">Book Tickets</button>
        </div>
      </div>
      <div className="movie-info">
        <h3 className="movie-name">{movie.title}</h3>
        <p className="movie-meta">
          <span className="movie-lang">{movie.language}</span>
          <span className="dot">•</span>
          <span className="movie-genre">{movie.genre?.replace("_", " ")}</span>
        </p>
      </div>
    </div>
  );
}

export default MovieCard;
