import { useEffect, useRef, useState } from "react";

import { Link } from "react-router-dom";

import "../index.css";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1800&q=90",

    eyebrow: "A BETTER PLACE TO STUDY",

    title: "Your Dreams Deserve a Place to Grow",

    subtitle:
      "Step into a peaceful study environment where every focused hour brings you closer to the future you imagine.",
  },

  {
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1800&q=90",

    eyebrow: "FOCUS • LEARN • ACHIEVE",

    title: "Focus Today. Succeed Tomorrow.",

    subtitle:
      "Leave distractions behind, open your books and give your goals the attention they deserve.",
  },

  {
    image:
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1800&q=90",

    eyebrow: "YOUR JOURNEY STARTS HERE",

    title: "Every Page Takes You One Step Further",

    subtitle:
      "Build your preparation one chapter, one hour and one determined day at a time at New Drishti Library.",
  },
];

const services = [
  {
    icon: "📚",

    title: "Dedicated Study Seats",

    text: "Comfortable individual seating designed for long and distraction-free study sessions.",
  },

  {
    icon: "💧",

    title: "Cool Drinking Water",

    text: "Clean and cool drinking water available for students throughout their study hours.",
  },

  {
    icon: "🥤",

    title: "Refreshment Area",

    text: "A dedicated refreshment space where you can take a short break and recharge.",
  },

  {
    icon: "🍱",

    title: "Lunch Area",

    text: "A separate lunch and meal area so you can enjoy your break comfortably.",
  },

  {
    icon: "📰",

    title: "Daily Newspaper",

    text: "Stay updated with daily news and current affairs while preparing for your goals.",
  },

  {
    icon: "📶",

    title: "High-Speed Wi-Fi",

    text: "Reliable internet access for online classes, research and digital study material.",
  },

  {
    icon: "❄️",

    title: "Comfortable Environment",

    text: "A peaceful, clean and comfortable atmosphere designed to keep you focused.",
  },

  {
    icon: "🔌",

    title: "Charging Facility",

    text: "Convenient charging access for your mobile, laptop and other study devices.",
  },

  {
    icon: "🔒",

    title: "Safe & Secure",

    text: "A disciplined and secure environment where you can concentrate on your preparation.",
  },
];

const timings = [
  {
    time: "08:00 AM – 02:00 PM",

    title: "Morning Shift",

    text: "Start your day with a fresh and focused six-hour study session.",
  },

  {
    time: "02:00 PM – 08:00 PM",

    title: "Evening Shift",

    text: "Continue your preparation in a calm and productive six-hour environment.",
  },

  {
    time: "08:00 PM – 08:00 AM",

    title: "Night Shift",

    text: "A dedicated twelve-hour study slot for students who prefer late-night preparation.",
  },
];

const plans = [
  {
    type: "NORMAL SEAT",

    title: "Normal Seat",

    price: "Contact for Price",

    description:
      "A comfortable dedicated study seat with all essential library facilities.",

    features: [
      "Dedicated study seat",

      "24×7 library access",

      "Cool drinking water",

      "Refreshment area",

      "Lunch area",

      "Daily newspaper",

      "Wi-Fi facility",

      "Charging facility",
    ],
  },

  {
    type: "SPECIAL SEAT",

    title: "Special Seat",

    price: "Contact for Price",

    description:
      "A premium seat option for students looking for an enhanced personal study experience.",

    features: [
      "Premium dedicated seat",

      "24×7 library access",

      "Cool drinking water",

      "Refreshment area",

      "Lunch area",

      "Daily newspaper",

      "Wi-Fi facility",

      "Charging facility",
    ],

    featured: true,
  },
];

const navItems = [
  ["home", "Home"],

  ["services", "Services"],

  ["pricing", "Pricing"],

  ["about", "About"],

  ["contact", "Contact"],
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);

  const [activeSection, setActiveSection] = useState("home");

  const revealRefs = useRef([]);

  const getUserRole = () => {
    if (localStorage.getItem("library_admin_token")) {
      return "admin";
    }

    if (localStorage.getItem("library_token")) {
      return "student";
    }

    return "guest";
  };

  const [userRole, setUserRole] = useState(getUserRole);

  useEffect(() => {
    const syncUserRole = () => {
      setUserRole(getUserRole());
    };

    syncUserRole();

    window.addEventListener("storage", syncUserRole);
    window.addEventListener("focus", syncUserRole);
    window.addEventListener("auth-changed", syncUserRole);

    return () => {
      window.removeEventListener("storage", syncUserRole);
      window.removeEventListener("focus", syncUserRole);
      window.removeEventListener("auth-changed", syncUserRole);
    };
  }, []);

  const isStudentLoggedIn = userRole === "student";
  const isAdminLoggedIn = userRole === "admin";
  const isLoggedIn = userRole !== "guest";

  const dashboardPath =
    userRole === "admin" ? "/admin/dashboard" : "/dashboard";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const elements = revealRefs.current.filter(Boolean);

    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("nd-visible");

            observer.unobserve(entry.target);
          }
        });
      },

      {
        threshold: 0.12,
      },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sections = navItems

      .map(([id]) => document.getElementById(id))

      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries

          .filter((entry) => entry.isIntersecting)

          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleSections[0]) {
          setActiveSection(visibleSections[0].target.id);
        }
      },

      {
        rootMargin: "-25% 0px -55% 0px",

        threshold: [0.05, 0.2, 0.5],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const addRevealRef = (element) => {
    if (element && !revealRefs.current.includes(element)) {
      revealRefs.current.push(element);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const previousSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const scrollToSection = (id) => {
    closeMenu();

    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",

        block: "start",
      });
    });
  };

  const getActionPath = () => {
    if (userRole === "admin") return "/admin/dashboard";
    if (userRole === "student") return "/dashboard";
    return "/login";
  };

  const actionLabel = isLoggedIn ? "Dashboard" : "Book Your Seat";

  return (
    <div className="nd-library-page">
      {/* ================= NAVBAR ================= */}

      <header className={`nd-navbar ${menuOpen ? "nd-navbar-open" : ""}`}>
        <div className="nd-navbar-inner">
          <Link to="/" className="nd-logo" onClick={closeMenu}>
            <span className="nd-logo-icon">
              <img
                src="/LibraryLogo.png"
                alt="New Drishti Library"
                style={{
                  width: "42px",
                  height: "42px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </span>

            <span className="nd-logo-text">
              <strong>New Drishti</strong>

              <small>LIBRARY</small>
            </span>
          </Link>

          <nav
            className={`nd-nav ${menuOpen ? "nd-nav-open" : ""}`}
            aria-label="Main navigation"
          >
            {navItems.map(([id, label]) => (
              <a
                href={`#${id}`}
                key={id}
                className={activeSection === id ? "active" : ""}
                onClick={(event) => {
                  event.preventDefault();

                  scrollToSection(id);
                }}
              >
                {label}
              </a>
            ))}

            {isStudentLoggedIn || isAdminLoggedIn ? (
              <Link
                to={dashboardPath}
                className="nd-mobile-login"
                onClick={closeMenu}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="nd-mobile-login"
                  onClick={closeMenu}
                >
                  Login
                </Link>

                <Link
                  to="/login"
                  className="nd-mobile-book"
                  onClick={closeMenu}
                >
                  Book Your Seat <span>→</span>
                </Link>
              </>
            )}
          </nav>

          <div className="nd-navbar-actions">
            {isStudentLoggedIn || isAdminLoggedIn ? (
              <Link to={dashboardPath} className="nd-login-btn">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="nd-login-btn">
                  Login
                </Link>

                <Link to="/login" className="nd-book-btn">
                  Book Your Seat <span>→</span>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className={`nd-menu-btn ${menuOpen ? "active" : ""}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span />

            <span />

            <span />
          </button>
        </div>
      </header>

      <main>
        {/* ================= HERO ================= */}

        <section id="home" className="nd-hero">
          {slides.map((slide, index) => (
            <div
              key={slide.title}
              className={`nd-slide ${
                index === currentSlide ? "nd-slide-active" : ""
              }`}
              style={{
                backgroundImage: `url("${slide.image}")`,
              }}
              aria-hidden={index !== currentSlide}
            >
              <div className="nd-hero-overlay" />
            </div>
          ))}

          <button
            type="button"
            className="nd-carousel-arrow nd-carousel-prev"
            onClick={previousSlide}
            aria-label="Previous slide"
          >
            ←
          </button>

          <button
            type="button"
            className="nd-carousel-arrow nd-carousel-next"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            →
          </button>

          <div className="nd-hero-content">
            <div className="nd-hero-badge">
              ✦ {slides[currentSlide].eyebrow}
            </div>

            <div className="nd-hero-counter">
              <span>{String(currentSlide + 1).padStart(2, "0")}</span>

              <i />

              <span>{String(slides.length).padStart(2, "0")}</span>
            </div>

            <h1>{slides[currentSlide].title}</h1>

            <p>{slides[currentSlide].subtitle}</p>

            <div className="nd-hero-buttons">
              <Link to={getActionPath()} className="nd-primary-btn">
                {actionLabel} <span>→</span>
              </Link>

              <button
                type="button"
                className="nd-secondary-btn"
                onClick={() => scrollToSection("services")}
              >
                Explore Facilities
              </button>
            </div>

            <div className="nd-hero-trust">
              <span>✓ 225 Seats</span>

              <span>✓ 24×7 Library</span>

              <span>✓ Student Focused</span>
            </div>
          </div>

          <div className="nd-carousel-dots">
            {slides.map((slide, index) => (
              <button
                type="button"
                key={slide.title}
                className={index === currentSlide ? "active" : ""}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="nd-scroll-indicator">
            <span>Scroll to explore</span>

            <div>↓</div>
          </div>
        </section>

        {/* ================= INTRO ================= */}

        <section className="nd-intro">
          <div
            ref={addRevealRef}
            className="nd-section-container nd-intro-grid nd-reveal"
          >
            <div>
              <span className="nd-section-label">YOUR STUDY SPACE</span>

              <h2>
                Where <span>Focus</span> Meets Opportunity
              </h2>
            </div>

            <div className="nd-intro-text">
              <p>
                New Drishti Library is more than just a place filled with books.
                It is a dedicated environment created for students who are
                serious about their future.
              </p>

              <p>
                Come with a goal, choose your seat and give your preparation the
                time and attention it deserves.
              </p>

              <button
                type="button"
                className="nd-text-link"
                onClick={() => scrollToSection("services")}
              >
                Explore our facilities <span>→</span>
              </button>
            </div>
          </div>
        </section>

        {/* ================= STATS ================= */}

        <section className="nd-stats">
          <div className="nd-section-container nd-stats-grid">
            <div className="nd-stat">
              <strong>225</strong>

              <span>Study Seats</span>
            </div>

            <div className="nd-stat">
              <strong>24×7</strong>

              <span>Library Access</span>
            </div>

            <div className="nd-stat">
              <strong>3</strong>

              <span>Study Shifts</span>
            </div>

            <div className="nd-stat">
              <strong>1</strong>

              <span>Goal — Your Success</span>
            </div>
          </div>
        </section>

        {/* ================= FACILITIES ================= */}

        <section id="services" className="nd-services">
          <div className="nd-section-container">
            <div ref={addRevealRef} className="nd-section-heading nd-reveal">
              <span className="nd-section-label">OUR FACILITIES</span>

              <h2>
                Everything You Need to <span>Study Better</span>
              </h2>

              <p>
                From comfortable seats to daily newspapers and refreshments, New
                Drishti Library is designed around your study needs.
              </p>
            </div>

            <div className="nd-services-grid">
              {services.map((service, index) => (
                <div
                  ref={addRevealRef}
                  className="nd-service-card nd-reveal"
                  key={service.title}
                  style={{
                    "--nd-delay": `${index * 70}ms`,
                  }}
                >
                  <div className="nd-service-top">
                    <div className="nd-service-icon">{service.icon}</div>

                    <span>0{index + 1}</span>
                  </div>

                  <h3>{service.title}</h3>

                  <p>{service.text}</p>

                  <div className="nd-card-line" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= TIMINGS ================= */}

        <section className="nd-timings">
          <div className="nd-section-container">
            <div ref={addRevealRef} className="nd-section-heading nd-reveal">
              <span className="nd-section-label">24×7 STUDY ACCESS</span>

              <h2>
                Choose Your <span>Study Time</span>
              </h2>

              <p>
                Study according to your routine with our three convenient time
                slots.
              </p>
            </div>

            <div className="nd-timing-grid">
              {timings.map((item, index) => (
                <div
                  ref={addRevealRef}
                  className="nd-timing-card nd-reveal"
                  key={item.title}
                  style={{
                    "--nd-delay": `${index * 100}ms`,
                  }}
                >
                  <div className="nd-timing-number">0{index + 1}</div>

                  <span className="nd-timing-label">{item.title}</span>

                  <h3>{item.time}</h3>

                  <p>{item.text}</p>
                </div>
              ))}
            </div>

            <div ref={addRevealRef} className="nd-open-badge nd-reveal">
              <span>●</span>
              New Drishti Library — Open 24×7
            </div>
          </div>
        </section>

        {/* ================= PRICING ================= */}

        <section id="pricing" className="nd-pricing">
          <div className="nd-section-container">
            <div ref={addRevealRef} className="nd-section-heading nd-reveal">
              <span className="nd-section-label">MEMBERSHIP OPTIONS</span>

              <h2>
                Choose Your <span>Seat</span>
              </h2>

              <p>
                Select the study seat that suits your preparation and
                requirements.
              </p>
            </div>

            <div className="nd-pricing-grid">
              {plans.map((plan, index) => (
                <div
                  ref={addRevealRef}
                  className={`nd-price-card nd-reveal ${
                    plan.featured ? "nd-price-featured" : ""
                  }`}
                  key={plan.title}
                  style={{
                    "--nd-delay": `${index * 120}ms`,
                  }}
                >
                  {plan.featured && (
                    <div className="nd-popular-badge">MOST POPULAR</div>
                  )}

                  <span className="nd-price-type">{plan.type}</span>

                  <h3>{plan.title}</h3>

                  <div className="nd-price">{plan.price}</div>

                  <p className="nd-price-description">{plan.description}</p>

                  <div className="nd-price-features">
                    {plan.features.map((feature) => (
                      <div key={feature}>
                        <span>✓</span>

                        <p>{feature}</p>
                      </div>
                    ))}
                  </div>

                  <Link to={getActionPath()} className="nd-price-btn">
                    {isLoggedIn ? "Dashboard" : "Book This Seat"} <span>→</span>
                  </Link>
                </div>
              ))}
            </div>

            <p className="nd-pricing-note">
              * Contact New Drishti Library for the current membership price and
              availability.
            </p>
          </div>
        </section>

        {/* ================= ABOUT ================= */}

        <section id="about" className="nd-about">
          <div className="nd-section-container nd-about-grid">
            <div
              ref={addRevealRef}
              className="nd-about-image nd-reveal nd-reveal-left"
            >
              <img
                src="https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1000&q=90"
                alt="New Drishti Library reading area"
              />

              <div className="nd-about-floating-card">
                <strong>New Drishti</strong>

                <span>Your place to focus.</span>
              </div>
            </div>

            <div
              ref={addRevealRef}
              className="nd-about-content nd-reveal nd-reveal-right"
            >
              <span className="nd-section-label">ABOUT NEW DRISHTI</span>

              <h2>
                A Space Designed for Your <span>Dreams</span>
              </h2>

              <p>
                At New Drishti Library, we believe that the right environment
                can make a huge difference in a student's preparation.
              </p>

              <p>
                Our goal is simple — provide a clean, peaceful and disciplined
                study space where students can spend their valuable time
                learning and preparing for their future.
              </p>

              <div className="nd-about-points">
                <div>
                  <span>✓</span>

                  <p>Dedicated study environment</p>
                </div>

                <div>
                  <span>✓</span>

                  <p>Comfortable individual seating</p>
                </div>

                <div>
                  <span>✓</span>

                  <p>Cool drinking water</p>
                </div>

                <div>
                  <span>✓</span>

                  <p>Refreshment and lunch area</p>
                </div>

                <div>
                  <span>✓</span>

                  <p>Daily newspaper and current affairs</p>
                </div>

                <div>
                  <span>✓</span>

                  <p>24×7 study access</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= MOTIVATION ================= */}

        <section className="nd-quote">
          <div className="nd-quote-overlay" />

          <div
            ref={addRevealRef}
            className="nd-section-container nd-quote-content nd-reveal"
          >
            <span>YOUR FUTURE IS BUILT ONE DAY AT A TIME.</span>

            <h2>
              Your Competition Is Studying.
              <br />
              <em>So Should You.</em>
            </h2>

            <p>
              One focused hour today can become the achievement you celebrate
              tomorrow.
            </p>

            <Link to={getActionPath()} className="nd-primary-btn">
              {isLoggedIn ? "Dashboard" : "Start Your Journey"} <span>→</span>
            </Link>
          </div>
        </section>

        {/* ================= CONTACT ================= */}

        <section id="contact" className="nd-contact">
          <div className="nd-section-container nd-contact-grid">
            <div
              ref={addRevealRef}
              className="nd-contact-content nd-reveal nd-reveal-left"
            >
              <span className="nd-section-label">GET IN TOUCH</span>

              <h2>Have a Question?</h2>

              <p>
                Want to know more about our seats, facilities, timings or
                membership? Get in touch with New Drishti Library.
              </p>

              <a href="tel:+915881299022" className="nd-phone">
                <span>📞</span>

                <div>
                  <small>Call Us</small>

                  <strong>6394468584</strong>
                </div>
              </a>
            </div>

            <div
              ref={addRevealRef}
              className="nd-contact-card nd-reveal nd-reveal-right"
            >
              <div className="nd-contact-card-icon">📚</div>

              <h3>Ready to Start Studying?</h3>

              <p>
                Create your account and book your seat to begin your study
                journey at New Drishti Library.
              </p>

              <Link to={getActionPath()} className="nd-primary-btn">
                {actionLabel} <span>→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}

      <footer className="nd-footer">
        <div className="nd-section-container nd-footer-grid">
          <div className="nd-footer-brand">
            <Link to="/" className="nd-logo">
              <span className="nd-logo-icon">
                <img
                  src="/LibraryLogo.png"
                  alt="New Drishti Library"
                  style={{
                    width: "42px",
                    height: "42px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </span>

              <span className="nd-logo-text">
                <strong>New Drishti</strong>

                <small>LIBRARY</small>
              </span>
            </Link>

            <p>
              A peaceful place to study, focus and work towards your dreams.
            </p>
          </div>

          <div className="nd-footer-column">
            <h4>Quick Links</h4>

            {navItems.map(([id, label]) => (
              <a
                href={`#${id}`}
                key={id}
                onClick={(event) => {
                  event.preventDefault();

                  scrollToSection(id);
                }}
              >
                {label}
              </a>
            ))}
          </div>

          <div className="nd-footer-column">
            <h4>Student</h4>

            <Link to="/login">Login</Link>

            <Link to="/register">Register</Link>

            <Link to="/login">Book Your Seat</Link>

            <Link to="/admin/login" className="footer-admin-link">
              Admin Login
            </Link>
          </div>

          <div className="nd-footer-column">
            <h4>Contact</h4>

            <a href="tel:+915881299022">📞 6394468584</a>

            <span>📚 New Drishti Library</span>

            <span>⏰ Open 24×7</span>
          </div>
        </div>

        <div className="nd-footer-bottom">
          <p>
            © {new Date().getFullYear()} New Drishti Library. All Rights
            Reserved.
          </p>

          <p>Built for students. Built for success.</p>
        </div>
      </footer>
    </div>
  );
}
