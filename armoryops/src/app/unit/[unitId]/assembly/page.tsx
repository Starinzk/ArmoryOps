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
  Button,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Define the assembly stages in order - this should match your Prisma enum order
const ASSEMBLY_STAGES_ORDER = [
  'LAP_AND_CLEAN',
  'PIN_EJECTOR',
  'INSTALL_EXTRACTOR',
  'FIT_BARREL',
  'TRIGGER_ASSEMBLY',
  'BUILD_SLIDE',
  'ASSEMBLE_LOWER',
  'MATE_SLIDE_FRAME',
  'FUNCTION_TEST',
  'FINAL_QC',
  'PACKAGE_AND_SERIALIZE'
] as const; // Use "as const" for stricter typing with .includes()

type AssemblyPageProps = {};

export default function AssemblyChecklistPage({}: AssemblyPageProps) {
  const params = useParams();
  const router = useRouter();
  const unitId = typeof params.unitId === 'string' ? params.unitId : '';

  const { data: unitDetails, isLoading, error, isError } = 
    api.assembly.getAssemblyDetailsByUnitId.useQuery(
      { unitId }, 
      { enabled: !!unitId }
    );

  if (isLoading || !unitId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !unitDetails) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error?.message || 'Could not load unit assembly details.'}
        </Alert>
        {/* TODO: Make this back button go to the correct unit list / batch detail page */}
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ mt: 2 }}>
          Back
        </Button>
      </Box>
    );
  }
  
  // Determine batchId for the back button if unitDetails and batch are loaded
  const batchId = unitDetails.batchId;

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, m: { xs: 1, md: 2 } }} elevation={2}>
      <Button 
        variant="outlined" 
        startIcon={<ArrowBackIcon />} 
        onClick={() => router.push(`/batch/${batchId}`)} // Navigate back to the batch detail page
        sx={{ mb: 2 }}
        disabled={!batchId}
      >
        Back to Batch {batchId ? `(${batchId})` : ''} {/* TODO: fetch batch name if needed */}
      </Button>

      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Assembly: Unit {unitDetails.serialNumber}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Current Stage: {unitDetails.currentStage ?? 'Not Started'}
      </Typography>
      
      {/* TODO: Add Assembly Progress Bar here */}

      <List sx={{ mt: 2 }}>
        {ASSEMBLY_STAGES_ORDER.map((stage, index) => {
          const isCurrentStage = unitDetails.currentStage === stage;
          // TODO: Add logic for completed stages, locked stages
          const stageLog = unitDetails.unitStageLogs.find(log => log.stage === stage && log.status === 'COMPLETE');
          const isCompleted = !!stageLog;

          return (
            <Box key={stage}>
              <ListItem 
                // TODO: Add collapsible/stepper behavior
                // TODO: Add click handler to expand/collapse or go to stage details
                sx={{
                  border: '1px solid #eee',
                  mb: 1,
                  borderRadius: '4px',
                  backgroundColor: isCurrentStage ? 'primary.lighter' : (isCompleted ? 'success.lighter' : 'inherit'),
                  // TODO: Add styling for locked stages (e.g., greyed out)
                }}
              >
                <ListItemText 
                  primary={`${index + 1}. ${stage.replace(/_/g, ' ')}`}
                  secondary={isCompleted ? `Completed by ${stageLog?.completedByUser?.name ?? 'N/A'} on ${new Date(stageLog?.timestamp ?? 0).toLocaleDateString()}` : (isCurrentStage ? 'Current Stage' : 'Pending')}
                />
                {/* TODO: Add [Mark Complete] button, checklist items, file upload, rejection form here */}
              </ListItem>
              {index < ASSEMBLY_STAGES_ORDER.length -1 && <Divider sx={{mb:1, display: 'none'}}/> /* Optional divider if not using cards */}
            </Box>
          );
        })}
      </List>
    </Paper>
  );
} 