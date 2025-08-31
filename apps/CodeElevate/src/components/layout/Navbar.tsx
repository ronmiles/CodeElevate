import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.svg';
import { getIsNewDesign } from '../../utils/featureFlags';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  const isNew = getIsNewDesign();

  const outerClasses = isNew
    ? 'bg-secondary-background border-border rounded-full mt-3 max-w-5xl mx-auto'
    : 'bg-secondary-background border border-border';

  const innerClasses = isNew
    ? 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'
    : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <nav className={outerClasses}>
      <div className={innerClasses}>
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={logo}
                  alt="CodeElevate Logo"
                  className="h-7 w-7 mr-1"
                />
              </motion.div>
              <span className="text-xl font-bold text-text">CodeElevate</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <div className="ml-2 flex items-center space-x-3">
              <button
                onClick={signOut}
                className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text hover:bg-background transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center space-x-3">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-text-secondary hover:text-text hover:bg-background focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden border-t border-border overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={signOut}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:text-text hover:bg-background transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
