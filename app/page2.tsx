export default function Home() {
  return (
    <>
      {/* Navigation Bar */}
      <nav
        style={{
          width: '100%',
          maxWidth: 1300,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '32px 0 28px 0',
        }}
      >
        {/* Logo */}
        <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: -1 }}>
          HY/ONE
        </span>
        {/* Nav Links */}
        <div
          style={{
            display: 'flex',
            gap: 36,
            alignItems: 'center',
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          <a
            href="#"
            style={{ color: '#222', textDecoration: 'none', padding: '0 4px' }}
          >
            How its work
          </a>
          <a
            href="#"
            style={{ color: '#222', textDecoration: 'none', padding: '0 4px' }}
          >
            Service
          </a>
          <a
            href="#"
            style={{ color: '#222', textDecoration: 'none', padding: '0 4px' }}
          >
            Pricing
          </a>
          <a
            href="#"
            style={{ color: '#222', textDecoration: 'none', padding: '0 4px' }}
          >
            Templates
          </a>
        </div>
        {/* Get Started button */}
        <button
          style={{
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 22px',
            fontWeight: 600,
            fontSize: 14,
            boxShadow: '0 1px 4px 0 rgba(0,0,0,0.10)',
          }}
        >
          Get Started
        </button>
      </nav>

      {/* Main Hero Section */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 30,
        }}
      >
        {/* Announcement */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 12,
            fontWeight: 500,
            color: '#444',
            gap: 6,
            marginBottom: 26,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#19C37D',
            }}
          />
          <span>Available For New Works</span>
        </div>
        {/* Headline */}
        <h1
          style={{
            fontWeight: 700,
            fontSize: 50,
            textAlign: 'center',
            lineHeight: '1.13',
            margin: 0,
            letterSpacing: '-2px',
          }}
        >
          Elevate Your Startup
          <br />
          with World-Class Design
        </h1>
        {/* Subheading */}
        <p
          style={{
            marginTop: 23,
            marginBottom: 35,
            fontSize: 16,
            color: '#878787',
            maxWidth: 430,
            textAlign: 'center',
            fontWeight: 400,
          }}
        >
          We don&apos;t just design. We create experiences that
          <br />
          drive growth and innovation
        </p>
        {/* Buttons */}
        <div style={{ display: 'flex', gap: 18, marginBottom: 44 }}>
          <button
            style={{
              background: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              padding: '13px 32px',
              boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)',
            }}
          >
            Get Started
          </button>
          <button
            style={{
              background: '#fff',
              color: '#111',
              border: '1px solid #e4e4e4',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              padding: '13px 32px',
            }}
          >
            Choose a Plan
          </button>
        </div>

        {/* Card showcase (Placeholder) */}
        <div style={{ display: 'flex', gap: 18, marginTop: 12 }}>
          <div
            style={{
              width: 220,
              height: 130,
              background: '#101116',
              borderRadius: 11,
              boxShadow: '0 10px 44px 0 rgba(0,0,0,0.17)',
              transform: 'rotate(-7.5deg)',
              overflow: 'hidden',
            }}
          />
          <div
            style={{
              width: 220,
              height: 135,
              background: '#fff',
              borderRadius: 10,
              boxShadow: '0 10px 44px 0 rgba(0,0,0,0.18)',
              transform: 'rotate(-1.5deg)',
              overflow: 'hidden',
              border: '1px solid #f4f4f4',
            }}
          />
          <div
            style={{
              width: 220,
              height: 140,
              background: '#181925',
              borderRadius: 10,
              boxShadow: '0 10px 44px 0 rgba(0,0,0,0.16)',
              zIndex: 1,
              position: 'relative',
              transform: 'rotate(2deg)',
              overflow: 'hidden',
              border: '1px solid #191b28',
            }}
          />
          <div
            style={{
              width: 220,
              height: 142,
              background: 'linear-gradient(110deg, #ff7500 60%, #fb426a 100%)',
              borderRadius: 13,
              boxShadow: '0 10px 44px 0 rgba(0,0,0,0.16)',
              transform: 'rotate(9deg)',
              border: '1px solid #ffeab2',
              overflow: 'hidden',
            }}
          />
        </div>
      </section>
    </>
  );
}
