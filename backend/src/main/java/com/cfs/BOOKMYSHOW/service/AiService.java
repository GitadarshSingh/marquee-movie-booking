package com.cfs.BOOKMYSHOW.service;

import com.cfs.BOOKMYSHOW.model.Movie;
import com.cfs.BOOKMYSHOW.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Autowired
    private MovieRepository movieRepository;

    private final RestTemplate rest = createRest();
    private final ObjectMapper om = new ObjectMapper();

    private static final String MODEL = "gemini-3.8-flash";

    private static final String[] LANGUAGES =
            {"Hindi", "English", "Tamil", "Telugu", "Malayalam", "Kannada", "Japanese", "Korean", "Punjabi", "Bengali", "Marathi"};
    private static final String[] GENRES =
            {"Action", "Comedy", "Thriller", "Drama", "Romance", "Horror", "Sci-Fi", "Animation",
                    "Adventure", "Fantasy", "Crime", "Mystery", "Family", "Biography", "War"};

    // Fuzzy match mein ignore hone wale common words
    private static final Set<String> STOP = Set.of(
            "the", "movie", "movies", "film", "show", "dikhao", "dikha", "mujhe", "chahiye",
            "about", "any", "please", "for", "and", "with", "tell", "find", "search", "book");

    private static final double FUZZY_MIN = 0.7; // zyada galat result aaye to 0.75/0.8 karo

    private static final String EXTRACT_PROMPT = """
        Extract movie search filters from the user message.
        Return ONLY JSON: {"language":string|null,"genre":string|null,"title":string|null}
        language examples: Hindi, English, Tamil, Telugu. genre examples: Action, Comedy, Thriller, Drama, Romance.
        Use null when not mentioned. No explanation.
        User message: """;

    private static RestTemplate createRest() {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(3000);
        f.setReadTimeout(5000);
        return new RestTemplate(f);
    }

    private String gemini(String prompt) throws Exception {
        ObjectNode body = om.createObjectNode();
        ArrayNode contents = om.createArrayNode();
        ObjectNode content = om.createObjectNode();
        ArrayNode parts = om.createArrayNode();
        parts.add(om.createObjectNode().put("text", prompt));
        content.set("parts", parts);
        contents.add(content);
        body.set("contents", contents);

        ObjectNode gc = om.createObjectNode();
        gc.put("responseMimeType", "application/json");
        body.set("generationConfig", gc);

        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.set("x-goog-api-key", apiKey);

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent";
        String res = rest.postForObject(url, new HttpEntity<>(om.writeValueAsString(body), h), String.class);
        JsonNode root = om.readTree(res);
        return root.get("candidates").get(0).get("content").get("parts").get(0).get("text").asString();
    }

    // Message mein language/genre dhoondo (tez, bina network ke)
    private String[] keywordFilters(String msg) {
        String m = msg.toLowerCase();
        String lang = null, genre = null;
        for (String l : LANGUAGES) if (m.contains(l.toLowerCase())) { lang = l; break; }
        for (String g : GENRES) if (m.contains(g.toLowerCase())) { genre = g; break; }
        String title = (lang == null && genre == null) ? msg.trim() : null;
        return new String[]{lang, genre, title};
    }

    private String txt(JsonNode n, String f) {
        JsonNode v = n.get(f);
        if (v == null || v.isNull()) return null;
        String s = v.asString();
        return (s == null || s.isBlank() || s.equalsIgnoreCase("null")) ? null : s;
    }

    // ---------- Fuzzy (spelling galat ho tab bhi) ----------

    // Levenshtein distance: do words mein kitne characters ka farak hai
    private static int dist(String a, String b) {
        int[] prev = new int[b.length() + 1];
        int[] cur = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) prev[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            cur[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                cur[j] = Math.min(Math.min(cur[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            int[] t = prev; prev = cur; cur = t;
        }
        return prev[b.length()];
    }

    private static double sim(String a, String b) {
        if (a.isEmpty() || b.isEmpty()) return 0;
        return 1.0 - (double) dist(a, b) / Math.max(a.length(), b.length());
    }

    private static List<String> tokens(String s) {
        List<String> out = new ArrayList<>();
        for (String w : s.toLowerCase().split("[^a-z0-9]+")) {
            if (w.length() >= 3 && !STOP.contains(w)) out.add(w);
        }
        return out;
    }

    // 0 (alag) se 1 (same): query ke har word ko title ke words se compare karo
    private static double score(String query, String title) {
        String qn = query.toLowerCase().replaceAll("[^a-z0-9]", "");
        String tn = title.toLowerCase().replaceAll("[^a-z0-9]", "");
        if (!qn.isEmpty() && tn.contains(qn)) return 1.0;

        List<String> qt = tokens(query);
        List<String> tt = tokens(title);
        double best = 0;
        for (String q : qt) {
            for (String t : tt) {
                best = Math.max(best, sim(q, t));
            }
            best = Math.max(best, sim(q, tn)); // single-word title ke liye
        }
        return best;
    }

    private List<Movie> fuzzy(String q) {
        return movieRepository.findAll().stream()
                .filter(m -> m.getTitle() != null && score(q, m.getTitle()) >= FUZZY_MIN)
                .sorted((a, b) -> Double.compare(score(q, b.getTitle()), score(q, a.getTitle())))
                .toList();
    }

    // normal DB search, kuch na mile aur title ho to fuzzy
    private List<Movie> findRows(String[] fl) {
        List<Movie> rows = movieRepository.search(fl[0], fl[1], fl[2]);
        if (rows.isEmpty() && fl[2] != null) rows = fuzzy(fl[2]);
        return rows;
    }

    public Map<String, Object> chat(String userMsg) {
        // 1) Tez keyword match (language / genre)
        String[] fl = keywordFilters(userMsg);
        boolean matched = fl[0] != null || fl[1] != null;
        boolean usedAi = false;

        // 2) DB search (+ fuzzy agar title ho)
        List<Movie> rows = findRows(fl);

        // 3) Abhi bhi kuch nahi mila aur keyword bhi nahi tha, tab Gemini (slow) try karo
        if (rows.isEmpty() && !matched) {
            try {
                JsonNode f = om.readTree(gemini(EXTRACT_PROMPT + userMsg));
                if (f.isArray() && f.size() > 0) f = f.get(0);
                String[] ai = new String[]{txt(f, "language"), txt(f, "genre"), txt(f, "title")};
                rows = findRows(ai);
                usedAi = true;
            } catch (Exception e) {
                System.out.println("Gemini fail: " + e.getMessage());
            }
        }

        List<Map<String, Object>> found = new ArrayList<>();
        rows.stream().limit(8).forEach(m -> {
            Map<String, Object> x = new LinkedHashMap<>();
            x.put("id", m.getId());
            x.put("title", m.getTitle());
            x.put("language", m.getLanguage());
            x.put("genre", m.getGenre());
            x.put("durationMins", m.getDurationMins());
            found.add(x);
        });

        String reply = found.isEmpty()
                ? "Is search ke liye koi movie nahi mili. Dusri language ya genre try karo."
                : found.size() + " movie(s) mili. Neeche se choose karo:";

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("reply", reply);
        out.put("movies", found);
        out.put("ai", usedAi);
        return out;
    }
}