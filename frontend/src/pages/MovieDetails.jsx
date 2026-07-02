import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMovieById } from "../services/movieService";
import "./MovieDetails.css";

const TMDB_KEY = "c671e742f9950d49fe3751fc398f80ce";

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [tmdbData, setTmdbData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMovie(); }, [id]);

  const loadMovie = async () => {
    try {
      const data = await getMovieById(id);
      setMovie(data);
      await fetchTmdbData(data.title);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTmdbData = async (title) => {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}`
      );
      const data = await res.json();
      if (data.results?.length > 0) {
        const tmdbId = data.results[0].id;
        const detailRes = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_KEY}&append_to_response=credits`
        );
        const details = await detailRes.json();
        setTmdbData(details);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="md-loading">
      <div className="md-spinner" />
      <p>Loading...</p>
    </div>
  );

  if (!movie) return (
    <div className="md-loading">Movie not found</div>
  );

  const cast     = tmdbData?.credits?.cast?.slice(0, 10) || [];
  const genres   = tmdbData?.genres?.map(g => g.name) || [movie.genre?.replace(/_/g, " ")];
  const overview = tmdbData?.overview || movie.description;

  // Format duration: 165 mins → 2h 45m
  const formatDuration = (mins) => {
    if (!mins) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
  };

  const releaseDate = movie.releaseDate
    ? new Date(movie.releaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>

      {/* ── Hero banner ── */}
      <div className="md-hero">
        <div className="md-hero-bg" style={{ backgroundImage: `url(${movie.posterUrl})` }} />
        <div className="md-hero-overlay" />

        <div className="md-hero-content">
          {/* Left: info */}
          <div className="md-hero-info">
            <h1 className="md-title">{movie.title}</h1>

            {/* UA16+ | Hindi | 2h 45m */}
            <div className="md-meta-row">
              <span>UA16+</span>
              <span className="md-meta-sep">|</span>
              <span>{movie.language}</span>
              {movie.durationMins && (
                <>
                  <span className="md-meta-sep">|</span>
                  <span>{formatDuration(movie.durationMins)}</span>
                </>
              )}
            </div>

            {/* Description */}
            {overview && <p className="md-desc">{overview}</p>}

            {/* Genre chips */}
            {genres.length > 0 && (
              <div className="md-genre-chips">
                {genres.map((g) => (
                  <span key={g} className="md-genre-chip">{g}</span>
                ))}
              </div>
            )}

            {/* Release date */}
            {releaseDate && (
              <p className="md-release">Released {releaseDate}</p>
            )}

            {/* Book button */}
            <button
              className="md-book-btn"
              onClick={() => navigate(`/movie/${id}/theaters`)}
            >
              Book Tickets
            </button>
          </div>

          {/* Right: poster */}
          <div className="md-poster-wrap">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              onError={(e) => {
                e.target.src = `https://placehold.co/220x330/222/666?text=${encodeURIComponent(movie.title)}`;
              }}
            />
          </div>
        </div>
      </div>

      {/* ── White body ── */}
      <div className="md-body">
        <div className="md-body-inner">

          {/* About */}
          {overview && (
            <>
              <h2 className="md-section-title">About the movie</h2>
              <p className="md-about-text">{overview}</p>
              <div className="md-divider" />
            </>
          )}

          {/* Cast & Crew */}
          {cast.length > 0 && (
            <>
              <h2 className="md-section-title">Cast &amp; Crew</h2>
              <div className="md-cast-row">
                {cast.map((actor) => (
                  <div key={actor.id} className="md-cast-card">
                    <img
                      className="md-cast-img"
                      src={
                        actor.profile_path
                          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                          : `https://placehold.co/80x80/f0f0f0/aaa?text=${encodeURIComponent(actor.name[0])}`
                      }
                      alt={actor.name}
                    />
                    <p className="md-cast-name">{actor.name}</p>
                    {actor.character && (
                      <p className="md-cast-char">{actor.character}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default MovieDetails;