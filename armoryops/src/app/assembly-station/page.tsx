'use client';

import AssemblyProgressPanel from '~/components/AssemblyProgressPanel';
import { Box, Container, Typography } from '@mui/material';

export default function AssemblyStationPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold'}}>
        Assembly Station
      </Typography>
      <AssemblyProgressPanel />
    </Container>
  );
} 