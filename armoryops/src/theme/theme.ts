'use client';

import { createTheme } from '@mui/material/styles';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

// A light, minimal theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // A muted blue
    },
    secondary: {
      main: '#dc004e', // A muted pink/red
    },
    background: {
      default: '#ffffff', // White background
      paper: '#f5f5f5',   // Slightly off-white for paper elements
    },
    text: {
      primary: '#333333', // Dark grey for primary text
      secondary: '#555555', // Lighter grey for secondary text
    },
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
    h6: {
      fontWeight: 500,
    },
    // You can define other typography variants here
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff', // White app bar
          color: '#333333', // Dark text on app bar
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', // Subtle shadow
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff', // White drawer
        }
      }
    }
    // You can add other component overrides here
  },
});

export default theme; 