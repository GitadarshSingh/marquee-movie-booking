import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllMovies } from "../services/movieService";
import "./Home.css";

// ── Genre filter config ──────────────────────────────────────────
const FILTERS = [
  { label: "All",     value: "ALL" },
  { label: "Hindi",   value: "Hindi" },
  { label: "English", value: "English" },
  { label: "Action",  value: "ACTION" },
  { label: "Romance", value: "ROMANCE" },
  { label: "Comedy",  value: "COMEDY" },
  { label: "Sci-Fi",  value: "SCI_FI" },
  { label: "Horror",  value: "HORROR" },
];

// ── Hero Slider — District style ────────────────────────────────
function HeroSlider({ movies }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const featured = movies.slice(0, 5);

  useEffect(() => {
    if (!featured.length) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % featured.length), 4500);
    return () => clearInterval(t);
  }, [featured.length]);

  if (!featured.length) return null;
  const movie = featured[current];

  const goPrev = () => setCurrent((c) => (c - 1 + featured.length) % featured.length);
  const goNext = () => setCurrent((c) => (c + 1) % featured.length);

  // Build a readable meta string like "UA16+ | Action, Comedy"
  const genres = movie.genre
    ? movie.genre.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "";
  const metaRow = `UA16+ | ${genres}${movie.language ? `, ${movie.language}` : ""}`;

  return (
    <div className="hero-slider">
      {/* Blurred background — absolutely positioned behind everything */}
      <div className="hero-bg" style={{ backgroundImage: `url(${movie.posterUrl})` }} />
      <div className="hero-overlay" />

      <button className="hero-arrow-btn left" onClick={goPrev} aria-label="Previous">‹</button>

      <div className="hero-content">
        {/* Left: text */}
        <div className="hero-text">
          <h1 className="hero-title">{movie.title}</h1>
          <p className="hero-meta-row">{metaRow}</p>
          {movie.description && (
            <p className="hero-desc">{movie.description.slice(0, 180)}</p>
          )}
          <button
            className="hero-book-btn"
            onClick={() => navigate(`/movie/${movie.id}`)}
          >
            Book now
          </button>
        </div>

        {/* Right: poster */}
        <div className="hero-poster">
          <img src={movie.posterUrl} alt={movie.title}
            onError={(e) => { e.target.src = `https://placehold.co/240x360/f0f0f0/aaa?text=${encodeURIComponent(movie.title)}`; }}
          />
        </div>
      </div>

      <button className="hero-arrow-btn right" onClick={goNext} aria-label="Next">›</button>

      <div className="hero-dots">
        {featured.map((_, i) => (
          <button
            key={i}
            className={`hero-dot-btn ${i === current ? "active" : ""}`}
            onClick={() => setCurrent(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Single movie card (District style) ──────────────────────────
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
            e.target.src = `https://placehold.co/200x300/f0f0f0/aaa?text=${encodeURIComponent(movie.title)}`;
          }}
        />
        <div className="movie-overlay">
          <button
            className="book-now-btn"
            onClick={(e) => { e.stopPropagation(); navigate(`/movie/${movie.id}`); }}
          >
            Book tickets
          </button>
        </div>
      </div>
      <div className="movie-info">
        <p className="movie-name">{movie.title}</p>
        <div className="movie-meta">
          <span className="cert-badge">UA16+</span>
          <span className="meta-sep">|</span>
          <span className="lang-badge">{movie.language}</span>
        </div>
      </div>
    </div>
  );
}

// ── Movie grid section ───────────────────────────────────────────
function MovieSection({ title, movies, showSeeAll = true }) {
  const [expanded, setExpanded] = useState(false);
  if (!movies.length) return null;

  // District shows ~6 cards per row; default show first 6, expand on See all
  const visible = expanded ? movies : movies.slice(0, 6);

  return (
    <div className="movie-section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        {showSeeAll && movies.length > 6 && (
          <button className="see-all-btn" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Show less" : "See all →"}
          </button>
        )}
      </div>
      <div className="movies-grid">
        {visible.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}

// ── Main Home component ──────────────────────────────────────────
function Home() {
  const [movies, setMovies]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch]     = useState("");

  useEffect(() => {
    getAllMovies()
      .then(setMovies)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Filtering logic ──
  const applyFilter = (movies) => {
    if (activeFilter === "ALL") return movies;
    return movies.filter(
      (m) => m.language === activeFilter || m.genre === activeFilter
    );
  };

  const searchFiltered = search
    ? movies.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
    : movies;

  const filtered = applyFilter(searchFiltered);

  // ── Sections ──
  const thisWeek  = filtered.slice(0, 12);   // District: "This Week's Releases" = newest
  const hindi     = filtered.filter((m) => m.language === "Hindi");
  const english   = filtered.filter((m) => m.language === "English");
  const action    = filtered.filter((m) => m.genre === "ACTION");
  const scifi     = filtered.filter((m) => m.genre === "SCI_FI");
  const comedy    = filtered.filter((m) => ["COMEDY", "HORROR_COMEDY"].includes(m.genre));
  const drama     = filtered.filter((m) => ["DRAMA", "BIOGRAPHY", "ROMANCE"].includes(m.genre));

  if (loading) {
    return (
      <div className="home-loading">
        <div className="home-spinner" />
        <p>Loading movies...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Mobile search */}
      <div className="mobile-search">
        <input
          type="text"
          placeholder="Search movies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mobile-search-input"
        />
      </div>

      {/* Hero slider — only on default view */}
      {!search && activeFilter === "ALL" && <HeroSlider movies={movies} />}

      {/* Genre filter strip — exactly like District */}
      <div style={{ padding: "20px 0 0" }}>
        <div className="filter-strip">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-chip ${activeFilter === f.value ? "active" : ""}`}
              onClick={() => { setActiveFilter(f.value); setSearch(""); }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="home-content">
        {search ? (
          /* Search results */
          filtered.length > 0 ? (
            <>
              <p className="search-results-title">Results for "{search}"</p>
              <div className="movies-grid">
                {filtered.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
              </div>
            </>
          ) : (
            <div className="empty-state">No movies found for "{search}"</div>
          )
        ) : activeFilter !== "ALL" ? (
          /* Single filtered section */
          filtered.length > 0 ? (
            <MovieSection
              title={FILTERS.find(f => f.value === activeFilter)?.label + " Movies"}
              movies={filtered}
              showSeeAll={false}
            />
          ) : (
            <div className="empty-state">No movies in this category</div>
          )
        ) : (
          /* Default: District-style sections */
          <>
            <MovieSection title="This Week's Releases" movies={thisWeek} />
            {hindi.length   > 0 && <MovieSection title="Bollywood Hits"          movies={hindi} />}
            {english.length > 0 && <MovieSection title="Hollywood Blockbusters"  movies={english} />}
            {action.length  > 0 && <MovieSection title="Action Packed"           movies={action} />}
            {scifi.length   > 0 && <MovieSection title="Sci-Fi & Fantasy"        movies={scifi} />}
            {comedy.length  > 0 && <MovieSection title="Comedy & Fun"            movies={comedy} />}
            {drama.length   > 0 && <MovieSection title="Drama & Romance"         movies={drama} />}
          </>
        )}
      </div>
    </div>
  );
}

export default Home;