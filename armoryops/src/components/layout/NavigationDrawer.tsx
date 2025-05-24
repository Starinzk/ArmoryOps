'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

const drawerWidth = 240;

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string; // For routing, can be stubbed
  action?: () => void; // For actions like logout
}

const mainNavigationItems: NavigationItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Account', icon: <AccountCircleIcon />, path: '/account' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
];

const secondaryNavigationItems: NavigationItem[] = [
  { text: 'Logout', icon: <LogoutIcon />, path: '/logout', action: () => console.log('Logout clicked') }, // Stub action
];

interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function NavigationDrawer({ open, onClose }: NavigationDrawerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Placeholder for router navigation
  const handleNavigation = (path: string) => {
    console.log(`Navigating to ${path}`);
    // Replace with your actual router navigation logic, e.g., router.push(path)
    if (isMobile) {
      onClose(); // Close drawer on mobile after navigation
    }
  };

  const drawerContent = (
    <Box>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'space-between' : 'flex-end',
          px: [1],
          ...theme.mixins.toolbar, // Ensure proper height
        }}
      >
        {isMobile && (
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, ml:1 }}>
                Menu
            </Typography>
        )}
        <IconButton onClick={onClose}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {mainNavigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => handleNavigation(item.path)}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {secondaryNavigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => item.action ? item.action() : handleNavigation(item.path)}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
} 