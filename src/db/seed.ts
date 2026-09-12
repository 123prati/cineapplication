import { getDb } from "./index";
import {
  users,
  movies,
  genres,
  movieGenres,
  cinemas,
  auditoriums,
  seats,
  showtimes,
  showtimeSeats,
} from "./schema";
import { hashPassword } from "../lib/auth";
import { SEAT_STATUS, SEAT_TYPE, SCREEN_TYPE } from "../lib/constants";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  console.log("🌱 Starting CineBook database seed...");
  const db = getDb();

  // 1. Create Users
  const userPasswordHash = await hashPassword("Password123!");
  const adminPasswordHash = await hashPassword("AdminPassword123!");

  const [customerUser] = await db
    .insert(users)
    .values({
      name: "Jane CinemaGoer",
      email: "customer@cinebook.com",
      passwordHash: userPasswordHash,
      role: "USER",
    })
    .onConflictDoNothing()
    .returning();

  const [adminUser] = await db
    .insert(users)
    .values({
      name: "CineBook Administrator",
      email: "admin@cinebook.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    })
    .onConflictDoNothing()
    .returning();

  console.log("✅ Seeded Users (customer@cinebook.com, admin@cinebook.com)");

  // 2. Create Genres
  const genreList = [
    { name: "Sci-Fi", slug: "sci-fi" },
    { name: "Action", slug: "action" },
    { name: "Drama", slug: "drama" },
    { name: "Adventure", slug: "adventure" },
    { name: "Thriller", slug: "thriller" },
    { name: "Animation", slug: "animation" },
  ];

  const createdGenres: Record<string, string> = {};
  for (const g of genreList) {
    const [created] = await db
      .insert(genres)
      .values(g)
      .onConflictDoNothing()
      .returning();

    if (created) {
      createdGenres[g.slug] = created.id;
    } else {
      const [existing] = await db
        .select()
        .from(genres)
        .where(eq(genres.slug, g.slug));
      if (existing) createdGenres[g.slug] = existing.id;
    }
  }

  // 3. Create Movies
  const movieList = [
    {
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
      genres: ["sci-fi", "adventure", "drama"],
    },
    {
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
      genres: ["drama", "thriller"],
    },
    {
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
      genres: ["sci-fi", "adventure", "drama"],
    },
    {
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
      genres: ["animation", "action", "adventure"],
    },
    {
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
      genres: ["action", "thriller", "drama"],
    },
    {
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
      genres: ["sci-fi", "action", "thriller"],
    },
  ];

  const createdMovies: Record<string, string> = {};
  for (const m of movieList) {
    const { genres: movieGenreSlugs, ...movieData } = m;
    let movieId: string;

    const [created] = await db
      .insert(movies)
      .values(movieData)
      .onConflictDoNothing()
      .returning();

    if (created) {
      movieId = created.id;
    } else {
      const [existing] = await db
        .select()
        .from(movies)
        .where(eq(movies.slug, m.slug));
      movieId = existing?.id;
    }

    if (movieId) {
      createdMovies[m.slug] = movieId;
      for (const gSlug of movieGenreSlugs) {
        const genreId = createdGenres[gSlug];
        if (genreId) {
          await db
            .insert(movieGenres)
            .values({ movieId, genreId })
            .onConflictDoNothing();
        }
      }
    }
  }

  console.log("✅ Seeded Movies & Genres");

  // 4. Create Cinemas
  const cinemaData = [
    {
      name: "Grand Horizon Cinema",
      slug: "grand-horizon-cinema",
      address: "450 Broadway Ave, Downtown Metro",
      city: "New York",
      state: "NY",
      postalCode: "10013",
      phone: "(212) 555-0199",
    },
    {
      name: "Starlight IMAX Theatre",
      slug: "starlight-imax-theatre",
      address: "8800 Wilshire Blvd, Westside Promenade",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90211",
      phone: "(310) 555-0144",
    },
  ];

  const createdCinemas: Record<string, string> = {};
  for (const c of cinemaData) {
    let cinemaId: string;
    const [created] = await db
      .insert(cinemas)
      .values(c)
      .onConflictDoNothing()
      .returning();

    if (created) {
      cinemaId = created.id;
    } else {
      const [existing] = await db
        .select()
        .from(cinemas)
        .where(eq(cinemas.slug, c.slug));
      cinemaId = existing?.id;
    }
    if (cinemaId) createdCinemas[c.slug] = cinemaId;
  }

  console.log("✅ Seeded Cinemas");

  // 5. Create Auditoriums and Seats
  const auditoriumConfigs = [
    {
      cinemaSlug: "grand-horizon-cinema",
      name: "Auditorium 1 - IMAX Grand",
      screenType: SCREEN_TYPE.IMAX,
      rows: ["A", "B", "C", "D", "E", "F"],
      seatsPerRow: 10,
    },
    {
      cinemaSlug: "grand-horizon-cinema",
      name: "Auditorium 2 - Dolby Atmos",
      screenType: SCREEN_TYPE.DOLBY,
      rows: ["A", "B", "C", "D", "E"],
      seatsPerRow: 8,
    },
    {
      cinemaSlug: "starlight-imax-theatre",
      name: "Screen A - VIP Recliner Lounge",
      screenType: SCREEN_TYPE.VIP,
      rows: ["A", "B", "C", "D"],
      seatsPerRow: 8,
    },
    {
      cinemaSlug: "starlight-imax-theatre",
      name: "Screen B - Standard",
      screenType: SCREEN_TYPE.STANDARD,
      rows: ["A", "B", "C", "D", "E"],
      seatsPerRow: 8,
    },
  ];

  const createdAuditoriumSeats: Record<
    string,
    { auditoriumId: string; seats: Array<{ id: string; row: string; number: number; type: string }> }
  > = {};

  for (const config of auditoriumConfigs) {
    const cinemaId = createdCinemas[config.cinemaSlug];
    if (!cinemaId) continue;

    const totalSeats = config.rows.length * config.seatsPerRow;
    let auditoriumId: string;

    const [createdAud] = await db
      .insert(auditoriums)
      .values({
        cinemaId,
        name: config.name,
        screenType: config.screenType,
        totalSeats,
      })
      .onConflictDoNothing()
      .returning();

    if (createdAud) {
      auditoriumId = createdAud.id;
    } else {
      const [existing] = await db
        .select()
        .from(auditoriums)
        .where(eq(auditoriums.name, config.name));
      auditoriumId = existing?.id;
    }

    if (!auditoriumId) continue;

    // Seed seats for auditorium
    const audSeats: Array<{ id: string; row: string; number: number; type: string }> = [];

    for (let rIdx = 0; rIdx < config.rows.length; rIdx++) {
      const row = config.rows[rIdx];
      for (let num = 1; num <= config.seatsPerRow; num++) {
        // Seat categorization
        let seatType: any = SEAT_TYPE.STANDARD;
        if (config.screenType === SCREEN_TYPE.VIP) {
          seatType = SEAT_TYPE.VIP;
        } else if (rIdx >= 2 && rIdx <= 4) {
          seatType = SEAT_TYPE.PREMIUM;
        } else if (rIdx === 0 && (num === 1 || num === config.seatsPerRow)) {
          seatType = SEAT_TYPE.ACCESSIBLE;
        }

        const [createdSeat] = await db
          .insert(seats)
          .values({
            auditoriumId,
            row,
            number: num,
            type: seatType,
          })
          .onConflictDoNothing()
          .returning();

        if (createdSeat) {
          audSeats.push(createdSeat);
        } else {
          const [existing] = await db
            .select()
            .from(seats)
            .where(eq(seats.auditoriumId, auditoriumId));
          if (existing) audSeats.push(existing);
        }
      }
    }

    createdAuditoriumSeats[config.name] = { auditoriumId, seats: audSeats };
  }

  console.log("✅ Seeded Auditoriums & Seats");

  // 6. Create Showtimes and Showtime-Seats for today and next 3 days
  const now = new Date();
  const timeslots = [
    { hour: 13, min: 30, basePriceCents: 1400 },
    { hour: 17, min: 0, basePriceCents: 1650 },
    { hour: 20, min: 30, basePriceCents: 1800 },
  ];

  const movieSlugs = Object.keys(createdMovies);
  const audNames = Object.keys(createdAuditoriumSeats);

  for (let dayOffset = 0; dayOffset < 4; dayOffset++) {
    for (let slotIdx = 0; slotIdx < timeslots.length; slotIdx++) {
      const slot = timeslots[slotIdx];
      const movieSlug = movieSlugs[(dayOffset + slotIdx) % movieSlugs.length];
      const audName = audNames[(slotIdx + dayOffset) % audNames.length];

      const movieId = createdMovies[movieSlug];
      const audInfo = createdAuditoriumSeats[audName];

      if (!movieId || !audInfo) continue;

      const startTime = new Date(now);
      startTime.setDate(startTime.getDate() + dayOffset);
      startTime.setHours(slot.hour, slot.min, 0, 0);

      // Skip past showtimes
      if (startTime < now) {
        startTime.setDate(startTime.getDate() + 1);
      }

      const endTime = new Date(startTime.getTime() + 150 * 60 * 1000); // 2.5 hours duration

      const [st] = await db
        .insert(showtimes)
        .values({
          movieId,
          auditoriumId: audInfo.auditoriumId,
          startTime,
          endTime,
          basePriceCents: slot.basePriceCents,
          status: "SCHEDULED",
        })
        .returning();

      if (st && audInfo.seats.length > 0) {
        // Populate showtime_seats
        for (const seat of audInfo.seats) {
          let priceCents = slot.basePriceCents;
          if (seat.type === SEAT_TYPE.PREMIUM) priceCents += 400;
          if (seat.type === SEAT_TYPE.VIP) priceCents += 800;

          await db.insert(showtimeSeats).values({
            showtimeId: st.id,
            seatId: seat.id,
            status: SEAT_STATUS.AVAILABLE,
            priceCents,
          });
        }
      }
    }
  }

  console.log("✅ Seeded Showtimes & Showtime Seats");
  console.log("🎉 CineBook Database Seed Complete!");
}

// Direct execution support
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("Seed script finished successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed script failed:", err);
      process.exit(1);
    });
}
