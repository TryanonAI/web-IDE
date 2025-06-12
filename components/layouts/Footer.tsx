import React from 'react';
const Footer = ({
  mounted,
  theme,
  setTheme,
  email,
  setEmail,
  handleSubscribe,
}: {
  mounted: boolean;
  theme: string | undefined;
  setTheme: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  handleSubscribe: () => void;
}) => {
  return (
    <footer className="w-full py-5 relative z-10">
      {/* Subtle tech-inspired decorative element */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-5">
          {/* Main content area */}
          <div className="flex flex-col md:flex-row justify-between gap-6">
            {/* Brand and copyright */}
            <div className="flex items-center">
              <div className="flex items-center text-foreground/90">
                <span className="font-mono text-xs text-primary mr-1">
                  {'>'}
                </span>
                {/* <span className="font-medium">VYBE AI</span> */}
                <span className="font-medium">ANON</span>
                <div className="ml-2 px-2 py-0.5 rounded-full text-xs font-mono bg-primary/10 text-primary/70 border border-primary/20">
                  v1.0.4
                </div>
              </div>
            </div>

            {/* Newsletter signup - simple version */}
            <div className="flex items-center">
              <input
                type="email"
                placeholder="Subscribe to updates"
                className="py-1.5 px-3 text-sm bg-card/80 backdrop-blur-sm rounded-l-md border border-r-0 border-border/30 outline-none focus:border-primary/50 w-full max-w-[200px]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                className="bg-primary/90 hover:bg-primary text-primary-foreground px-3 py-1.5 rounded-r-md text-sm font-medium transition-colors"
                onClick={handleSubscribe}
              >
                Subscribe
              </button>
            </div>
          </div>

          {/* Links and socials */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-border/30">
            {/* Links */}
            <div className="flex space-x-6 mb-4 sm:mb-0">
              <a
                href="#"
                className="text-sm hover:text-primary transition-colors"
              >
                Docs
              </a>
              <a
                href="#"
                className="text-sm hover:text-primary transition-colors"
              >
                Examples
              </a>
              <a
                href="#"
                className="text-sm hover:text-primary transition-colors"
              >
                Blog
              </a>
              <span className="text-sm text-foreground/70">
                © {new Date().getFullYear()} ANON AI
              </span>
              {/* <span className="text-sm text-foreground/70">© {new Date().getFullYear()} VYBE AI</span> */}
            </div>

            {/* Theme toggle and socials */}
            <div className="flex items-center space-x-4">
              <button
                disabled={true}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-1.5 rounded-full hover:bg-primary/10 transition-colors cursor-not-allowed"
                aria-label="Toggle theme"
              >
                {mounted &&
                  (theme === 'dark' ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  ))}
              </button>

              <a
                href="#"
                className="p-1.5 rounded-full hover:bg-primary/10 transition-colors"
                aria-label="Twitter"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a
                href="#"
                className="p-1.5 rounded-full hover:bg-primary/10 transition-colors"
                aria-label="GitHub"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
              <a
                href="#"
                className="p-1.5 rounded-full hover:bg-primary/10 transition-colors"
                aria-label="Discord"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 9a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v7a5 5 0 0 0 5 5h4"></path>
                  <circle cx="15" cy="15" r="1"></circle>
                  <circle cx="18" cy="18" r="1"></circle>
                  <circle cx="21" cy="21" r="1"></circle>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
