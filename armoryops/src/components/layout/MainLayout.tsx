'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import NavigationDrawer from './NavigationDrawer';
import AppBar from './AppBar';
import theme from '../../theme/theme'; // Import the custom theme

const drawerWidth = 240; // Should match NavigationDrawer

interface MainLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export default function MainLayout({ children, pageTitle }: MainLayoutProps) {
  const [open, setOpen] = React.useState(true); // Drawer open by default on desktop
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  React.useEffect(() => {
    // Close drawer by default on mobile
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <ThemeProvider theme={theme}> {/* Apply the custom theme */}
      <Box sx={{ display: 'flex' }}>
        <CssBaseline /> {/* Normalize CSS and apply background from theme */}
        <AppBar 
            open={open && !isMobile} // AppBar adjusts only if drawer is open AND not mobile
            handleDrawerOpen={handleDrawerOpen} 
            title={pageTitle} 
        />
        <NavigationDrawer 
            open={open} 
            onClose={handleDrawerClose} 
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            marginTop: '64px', // Standard AppBar height
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            marginLeft: { sm: (open && !isMobile) ? `${drawerWidth}px` : 0 },
            transition: (theme) => theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: open ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          {/* Toolbar spacer not strictly needed if marginTop is on main Box, 
              but can be added if direct children of Box need specific alignment 
              with AppBar content. For now, marginTop on Box is simpler. */}
          {/* <Toolbar /> */}
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
} 