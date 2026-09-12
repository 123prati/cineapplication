// Client-side fallback data for GitHub Pages static hosting
import { formatCents } from "./constants";

export interface MockMovie {
  id: string;
  title: string;
  slug: string;
  description: string;
  durationMinutes: number;
  releaseDate: string;
  rating: string;
  language: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  genres: Array<{ name: string; slug: string }>;
  showtimeCount?: number;
}

export const MOCK_GENRES = [
  { name: "Sci-Fi", slug: "sci-fi" },
  { name: "Action", slug: "action" },
  { name: "Drama", slug: "drama" },
  { name: "Adventure", slug: "adventure" },
  { name: "Thriller", slug: "thriller" },
  { name: "Animation", slug: "animation" },
];

export const MOCK_CINEMAS = [
  {
    id: "cinema-1",
    name: "Grand Horizon Cinema",
    slug: "grand-horizon-cinema",
    address: "450 Broadway Ave, Downtown Metro",
    city: "New York",
    state: "NY",
    postalCode: "10013",
    phone: "(212) 555-0199",
    auditoriums: [
      { id: "aud-1", name: "Auditorium 1 - IMAX Grand", screenType: "IMAX", totalSeats: 60 },
      { id: "aud-2", name: "Auditorium 2 - Dolby Atmos", screenType: "DOLBY", totalSeats: 40 },
    ],
  },
  {
    id: "cinema-2",
    name: "Starlight IMAX Theatre",
    slug: "starlight-imax-theatre",
    address: "8800 Wilshire Blvd, Westside Promenade",
    city: "Los Angeles",
    state: "CA",
    postalCode: "90211",
    phone: "(310) 555-0144",
    auditoriums: [
      { id: "aud-3", name: "Screen A - VIP Recliner Lounge", screenType: "VIP", totalSeats: 32 },
      { id: "aud-4", name: "Screen B - Standard", screenType: "STANDARD", totalSeats: 40 },
    ],
  },
];

export const MOCK_MOVIES: MockMovie[] = [
  {
    id: "movie-1",
    title: "Dune: Part Two",
    slug: "dune-part-two",
    description:
      "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
    durationMinutes: 166,
    releaseDate: "2024-03-01",
    rating: "PG-13",
    language: "English",
    posterUrl:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop",
    trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
    genres: [
      { name: "Sci-Fi", slug: "sci-fi" },
      { name: "Adventure", slug: "adventure" },
      { name: "Drama", slug: "drama" },
    ],
  },
  {
    id: "movie-2",
    title: "Oppenheimer",
    slug: "oppenheimer",
    description:
      "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during the Manhattan Project, exploring the moral and geopolitical aftermath of the dawn of the nuclear era.",
    durationMinutes: 180,
    releaseDate: "2023-07-21",
    rating: "R",
    language: "English",
    posterUrl:
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800&auto=format&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600&auto=format&fit=crop",
    trailerUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg",
    genres: [
      { name: "Drama", slug: "drama" },
      { name: "Thriller", slug: "thriller" },
    ],
  },
  {
    id: "movie-3",
    title: "Interstellar",
    slug: "interstellar",
    description:
      "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans through a newly discovered wormhole.",
    durationMinutes: 169,
    releaseDate: "2014-11-07",
    rating: "PG-13",
    language: "English",
    posterUrl:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1600&auto=format&fit=crop",
    trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
    genres: [
      { name: "Sci-Fi", slug: "sci-fi" },
      { name: "Adventure", slug: "adventure" },
      { name: "Drama", slug: "drama" },
    ],
  },
  {
    id: "movie-4",
    title: "Spider-Man: Across the Spider-Verse",
    slug: "spider-man-across-the-spider-verse",
    description:
      "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When the heroes clash on how to handle a new threat, Miles must redefine what it means to be a hero.",
    durationMinutes: 140,
    releaseDate: "2023-06-02",
    rating: "PG",
    language: "English",
    posterUrl:
      "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=800&auto=format&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1600&auto=format&fit=crop",
    trailerUrl: "https://www.youtube.com/watch?v=cqGjhVJWtEg",
    genres: [
      { name: "Animation", slug: "animation" },
      { name: "Action", slug: "action" },
      { name: "Adventure", slug: "adventure" },
    ],
  },
  {
    id: "movie-5",
    title: "The Dark Knight",
    slug: "the-dark-knight",
    description:
      "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    durationMinutes: 152,
    releaseDate: "2008-07-18",
    rating: "PG-13",
    language: "English",
    posterUrl:
      "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=800&auto=format&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=1600&auto=format&fit=crop",
    trailerUrl: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
    genres: [
      { name: "Action", slug: "action" },
      { name: "Thriller", slug: "thriller" },
      { name: "Drama", slug: "drama" },
    ],
  },
  {
    id: "movie-6",
    title: "Inception",
    slug: "inception",
    description:
      "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.",
    durationMinutes: 148,
    releaseDate: "2010-07-16",
    rating: "PG-13",
    language: "English",
    posterUrl:
      "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=800&auto=format&fit=crop",
    backdropUrl:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop",
    trailerUrl: "https://www.youtube.com/watch?v=YoHD9XEInc0",
    genres: [
      { name: "Sci-Fi", slug: "sci-fi" },
      { name: "Action", slug: "action" },
      { name: "Thriller", slug: "thriller" },
    ],
  },
];

// Helper to generate seat matrix for client-side showtime
export function generateClientSeatMatrix(screenType = "IMAX") {
  const rows = ["A", "B", "C", "D", "E", "F"];
  const seatsPerRow = 10;
  const resultRows = [];

  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
    const rowName = rows[rIdx];
    const rowSeats = [];

    for (let num = 1; num <= seatsPerRow; num++) {
      let type = "STANDARD";
      let priceCents = 1400;

      if (screenType === "VIP" || rIdx >= 4) {
        type = "VIP";
        priceCents = 2200;
      } else if (rIdx >= 2) {
        type = "PREMIUM";
        priceCents = 1800;
      } else if (rIdx === 0 && (num === 1 || num === 10)) {
        type = "ACCESSIBLE";
        priceCents = 1400;
      }

      // Simulate a few pre-booked seats
      const isBooked = (rIdx === 1 && num === 4) || (rIdx === 3 && num === 5);

      rowSeats.push({
        id: `seat-${rowName}-${num}`,
        showtimeSeatId: `st-seat-${rowName}-${num}`,
        row: rowName,
        number: num,
        label: `${rowName}${num}`,
        type,
        status: isBooked ? "BOOKED" : "AVAILABLE",
        priceCents,
        isHeld: false,
        isBooked,
        isBlocked: false,
        isAvailable: !isBooked,
      });
    }

    resultRows.push({ row: rowName, seats: rowSeats });
  }

  return resultRows;
}
