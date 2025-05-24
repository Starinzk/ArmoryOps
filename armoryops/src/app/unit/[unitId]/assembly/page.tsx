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
  Divider,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Collapse
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AssemblyStage } from '@prisma/client';
import React, { useState, useEffect } from 'react';

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

// Placeholder Checklist Data
const PLACEHOLDER_CHECKLISTS: Record<typeof ASSEMBLY_STAGES_ORDER[number], string[]> = {
  LAP_AND_CLEAN: ['Lap slide to frame', 'Clean debris', 'Inspect for burrs'],
  PIN_EJECTOR: ['Verify ejector pin', 'Install pin', 'Check retention'],
  INSTALL_EXTRACTOR: ['Inspect extractor', 'Install extractor', 'Test tension'],
  FIT_BARREL: ['Check barrel fitment', 'Inspect rifling', 'Confirm lockup'],
  TRIGGER_ASSEMBLY: ['Assemble trigger group', 'Install trigger', 'Test pull weight'],
  BUILD_SLIDE: ['Install firing pin', 'Install sights', 'Check slide components'],
  ASSEMBLE_LOWER: ['Install magazine release', 'Install bolt catch', 'Attach grip'],
  MATE_SLIDE_FRAME: ['Align slide and frame', 'Insert slide stop', 'Verify smooth operation'],
  FUNCTION_TEST: ['Cycle dummy rounds', 'Test safety mechanisms', 'Dry fire test'],
  FINAL_QC: ['Visual inspection for blemishes', 'Confirm all parts present', 'Documentation check'],
  PACKAGE_AND_SERIALIZE: ['Add to inventory system', 'Prepare packaging', 'Box unit with accessories'],
};

type AssemblyPageProps = {};

export default function AssemblyChecklistPage({}: AssemblyPageProps) {
  const params = useParams();
  const router = useRouter();
  const unitId = typeof params.unitId === 'string' ? params.unitId : '';

  const utils = api.useUtils(); // For refetching after mutation

  const { data: unitDetails, isLoading, error: queryError, isError } = 
    api.assembly.getAssemblyDetailsByUnitId.useQuery(
      { unitId }, 
      { enabled: !!unitId }
    );

  const markCompleteMutation = api.assembly.markStageComplete.useMutation({
    onSuccess: async () => {
      await utils.assembly.getAssemblyDetailsByUnitId.invalidate({ unitId });
      // TODO: Add toast notification for success
    },
    onError: (err) => {
      // TODO: Add toast notification for error
      console.error("Failed to mark stage complete:", err);
      setMutationError(err.message);
    }
  });

  // State for current stage's checklist items
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Effect to initialize/reset checklist when current stage changes or data loads
  useEffect(() => {
    if (unitDetails?.currentStage) {
      const currentStageTasks = PLACEHOLDER_CHECKLISTS[unitDetails.currentStage as AssemblyStage] ?? [];
      const initialCheckState: Record<string, boolean> = {};
      currentStageTasks.forEach(task => initialCheckState[task] = false);
      setChecklistState(initialCheckState);
      setMutationError(null); // Clear previous errors
    }
  }, [unitDetails?.currentStage]);

  const handleChecklistChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecklistState({
      ...checklistState,
      [event.target.name]: event.target.checked,
    });
  };

  const handleMarkStageComplete = () => {
    if (!unitDetails?.currentStage) return;

    const currentTasks = PLACEHOLDER_CHECKLISTS[unitDetails.currentStage as AssemblyStage] ?? [];
    const allTasksChecked = currentTasks.every(task => checklistState[task]);

    if (!allTasksChecked) {
      setMutationError("All checklist items for the current stage must be completed.");
      return;
    }
    setMutationError(null);
    markCompleteMutation.mutate({ unitId, stage: unitDetails.currentStage as AssemblyStage });
  };

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
          {queryError?.message || 'Could not load unit assembly details.'}
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.back()} sx={{ mt: 2 }}>
          Back
        </Button>
      </Box>
    );
  }
  
  const batchId = unitDetails.batchId;
  const currentStagePrisma = unitDetails.currentStage;

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, m: { xs: 1, md: 2 } }} elevation={2}>
      <Button 
        variant="outlined" 
        startIcon={<ArrowBackIcon />} 
        onClick={() => router.push(`/batch/${batchId}`)} 
        sx={{ mb: 2 }}
        disabled={!batchId}
      >
        Back to Batch {batchId}
      </Button>

      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Assembly: Unit {unitDetails.serialNumber}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Current Stage: {currentStagePrisma ? currentStagePrisma.replace(/_/g, ' ') : 'Not Started'}
      </Typography>
      
      {mutationError && <Alert severity="error" sx={{mb: 2}}>{mutationError}</Alert>}
      {markCompleteMutation.error && !mutationError && <Alert severity="error" sx={{mb: 2}}>{markCompleteMutation.error.message}</Alert>}

      <List sx={{ mt: 2 }}>
        {ASSEMBLY_STAGES_ORDER.map((stageEnumValue, index) => {
          const stageName = stageEnumValue; // Already a string from the array
          const stageLog = unitDetails.unitStageLogs.find(log => log.stage === stageName && log.status === 'COMPLETE');
          const isCompleted = !!stageLog;
          const isCurrent = currentStagePrisma === stageName;
          const isLocked = !isCompleted && !isCurrent && 
                           (currentStagePrisma ? ASSEMBLY_STAGES_ORDER.indexOf(currentStagePrisma) < index : index > 0) ;

          const tasks = PLACEHOLDER_CHECKLISTS[stageName] ?? [];

          return (
            <Box key={stageName} sx={{ mb: 1 }}>
              <ListItem 
                sx={{
                  border: '1px solid #eee',
                  borderRadius: '4px',
                  backgroundColor: isCurrent ? 'primary.lighter' : (isCompleted ? 'success.lighter' : (isLocked ? 'grey.200' : 'inherit')),
                  opacity: isLocked ? 0.6 : 1,
                  pointerEvents: isLocked ? 'none' : 'auto',
                }}
              >
                <ListItemText 
                  primary={`${index + 1}. ${stageName.replace(/_/g, ' ')}`}
                  secondary={isCompleted ? `Completed by ${stageLog?.completedByUser?.name ?? 'N/A'} on ${new Date(stageLog?.timestamp ?? Date.now()).toLocaleDateString()}` : (isCurrent ? 'Current Stage - In Progress' : (isLocked ? 'Locked' : 'Pending'))}
                />
              </ListItem>
              <Collapse in={isCurrent && !isCompleted} timeout="auto" unmountOnExit>
                <Box sx={{ pl: 2, pr: 2, pb: 2, border: '1px solid #eee', borderTop: 'none', borderRadius: '0 0 4px 4px'}}>
                  <Typography variant="subtitle2" sx={{mt:1, mb:1, fontWeight:'medium'}}>Checklist:</Typography>
                  <FormGroup>
                    {tasks.map(task => (
                      <FormControlLabel 
                        key={task}
                        control={<Checkbox checked={checklistState[task] || false} onChange={handleChecklistChange} name={task} />}
                        label={task}
                      />
                    ))}
                  </FormGroup>
                  <Button 
                    variant="contained" 
                    onClick={handleMarkStageComplete} 
                    disabled={markCompleteMutation.isPending}
                    sx={{mt: 2}}
                  >
                    {markCompleteMutation.isPending ? <CircularProgress size={24}/> : 'Mark Stage Complete'}
                  </Button>
                  {/* TODO: Add Rejection Input/Button here */}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </List>
    </Paper>
  );
} 