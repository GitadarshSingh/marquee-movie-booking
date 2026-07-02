// update-posters.js
// Run: node update-posters.js

const mysql = require('mysql2/promise');

// ⚠️ Replace with your NEW API key after regenerating
const TMDB_API_KEY = 'c671e742f9950d49fe3751fc398f80ce';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'bms_db'
};

async function fetchPoster(movieTitle) {
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieTitle)}&language=en-US`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0 && data.results[0].poster_path) {
      return `https://image.tmdb.org/t/p/w500${data.results[0].poster_path}`;
    }
    return null;
  } catch (err) {
    console.error(`Error fetching poster for ${movieTitle}:`, err.message);
    return null;
  }
}

async function updatePosters() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('✅ Connected to MySQL');

  const [movies] = await connection.execute('SELECT id, title FROM movies');
  console.log(`📽️  Found ${movies.length} movies\n`);

  let updated = 0;
  let failed = 0;

  for (const movie of movies) {
    const posterUrl = await fetchPoster(movie.title);

    if (posterUrl) {
      await connection.execute(
        'UPDATE movies SET poster_url = ? WHERE id = ?',
        [posterUrl, movie.id]
      );
      console.log(`✅ ${movie.title} → ${posterUrl}`);
      updated++;
    } else {
      console.log(`❌ No poster found for: ${movie.title}`);
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 250));
  }

  await connection.end();
  console.log(`\n🎉 Done! Updated: ${updated} | Failed: ${failed}`);
}

updatePosters().catch(console.error);