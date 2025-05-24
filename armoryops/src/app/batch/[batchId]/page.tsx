'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, type RouterOutputs } from '~/trpc/react';
import { 
    Box, 
    Typography, 
    Paper, 
    CircularProgress, 
    Alert, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Chip,
    Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Progress } from '~/components/ui/progress';

// Infer types for cleaner code
type BatchDetail = RouterOutputs['batch']['getBatchById'];
type SerializedItem = BatchDetail['serializedItems'][number];

const getStatusChipColor = (status: SerializedItem['status']) => {
  switch (status) {
    case 'NOT_STARTED':
      return 'default';
    case 'IN_PROGRESS':
      return 'primary';
    case 'COMPLETE':
      return 'success';
    default:
      return 'default';
  }
};

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = typeof params.batchId === 'string' ? params.batchId : '';

  const { data: batch, isLoading, error, isError } = api.batch.getBatchById.useQuery(
    { id: batchId },
    { enabled: !!batchId }
  );

  if (isLoading || !batchId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !batch) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error?.message || 'Could not load batch details.'}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.push('/')} sx={{mt: 2}} >
          Back to Batches
        </Button>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, m: { xs: 1, md: 2 } }} elevation={2}>
      <Link href="/">
        <Button variant="outlined" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
          Back to Batches
        </Button>
      </Link>
      
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Batch: {batch.name}
      </Typography>

      <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Box>
          <Typography variant="subtitle1"><strong>Product Model:</strong> {batch.productModel}</Typography>
          <Typography variant="subtitle1"><strong>Status:</strong> <Chip label={batch.status} size="small" /> </Typography>
          <Typography variant="subtitle1"><strong>Quantity:</strong> {batch.quantity} units</Typography>
        </Box>
        <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
          <Typography variant="subtitle1">{batch.completedCount} / {batch.quantity} items completed</Typography>
          <Progress value={batch.progressPercent} className="h-2.5 mt-1" />
          <Typography variant="caption" color="text.secondary">{batch.progressPercent}% complete</Typography>
        </Box>
      </Box>
      
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2}}>
        Serialized Items ({batch.serializedItems.length})
      </Typography>

      {batch.serializedItems.length > 0 ? (
        <TableContainer component={Paper} elevation={1} sx={{border: '1px solid rgba(224, 224, 224, 1)'}}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table of serialized items">
            <TableHead sx={{ backgroundColor: 'grey.100'}}>
              <TableRow>
                <TableCell sx={{fontWeight: 'bold'}}>Serial Number</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Status</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Current Stage</TableCell>
                {/* Add more headers if needed, e.g., Last Updated */}
              </TableRow>
            </TableHead>
            <TableBody>
              {batch.serializedItems.map((item) => (
                <TableRow
                  key={item.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {item.serialNumber}
                  </TableCell>
                  <TableCell>
                    <Chip label={item.status} color={getStatusChipColor(item.status)} size="small" />
                  </TableCell>
                  <TableCell>{item.currentStage ?? 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography sx={{mt: 2, fontStyle: 'italic'}}>No serialized items assigned to this batch yet.</Typography>
      )}
    </Paper>
  );
} 