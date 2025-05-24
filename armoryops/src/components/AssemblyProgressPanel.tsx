'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '~/trpc/react';
import { AssemblyStage } from '@prisma/client';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Snackbar,
  Alert,
  TextField,
  IconButton,
  Stack,
  CircularProgress,
  useTheme,
  styled,
  StepConnector as MuiStepConnector,
  stepConnectorClasses
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

// Define the frontend's expected structure for a unit's assembly progress
interface UnitAssemblyData {
  id: string;
  serialNumber: string;
  productName: string;
  currentStage: AssemblyStage;
  stages: Record<AssemblyStage, 'not_started' | 'in_progress' | 'complete'>;
}

// Define the order of assembly stages - this MUST match your Prisma Enum and backend logic
// It's often better to fetch this from the backend or a shared schema if it can change
const ASSEMBLY_STAGES_ORDER = Object.values(AssemblyStage);

interface AssemblyProgressPanelProps {
  // Props if any, e.g., pre-loaded unitId
}

// Styled StepConnector
const CustomStepConnector = styled(MuiStepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10, // Adjust vertical position if needed, to align with StepIcon
    left: 'calc(-50% + 16px)', // Adjust horizontal positioning
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
      borderTopWidth: 3,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.success.main, // Or theme.palette.primary.main if you prefer consistency
      borderTopWidth: 3,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400],
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

export default function AssemblyProgressPanel({}: AssemblyProgressPanelProps) {
  const theme = useTheme();
  const utils = api.useUtils();

  const [currentUnit, setCurrentUnit] = useState<UnitAssemblyData | null>(null);
  const [serialInput, setSerialInput] = useState('');
  const [isLoadingUnit, setIsLoadingUnit] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [isCompletingStage, setIsCompletingStage] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');

  const assemblyHasStarted = currentUnit && currentUnit.currentStage !== null;

  const { refetch: fetchUnitBySerial } = api.assembly.getUnitAssemblyProgressBySerial.useQuery(
    { serialNumber: serialInput.trim() },
    { enabled: false }
  );

  const markStageCompleteMutation = api.assembly.markStageComplete.useMutation({
    onSuccess: async (data, variables) => {
      await utils.batch.getAllBatches.invalidate();
      if (currentUnit?.serialNumber) { // Ensure currentUnit and serialNumber exist before invalidating
        await utils.assembly.getUnitAssemblyProgressBySerial.invalidate({serialNumber: currentUnit.serialNumber});
      }
      // Invalidate the specific batch details query using the batchId from the mutation response.
      if (data?.batchId) { 
        await utils.batch.getBatchById.invalidate({ id: data.batchId });
      } else {
        // Fallback or warning if batchId is not in the response for some reason.
        console.warn("batchId not available from markStageComplete mutation response, BatchDetailPage might not refresh as expected.");
        // Optionally, you could do a broader invalidation here if critical, e.g.:
        // await utils.batch.invalidate(); // This invalidates all queries under batch router.
      }
      
      setSnackbarMessage('Stage marked complete & data saved!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setIsCompletingStage(false);

      const stageCompleted = variables.stage as AssemblyStage;
      const completedStageIndex = ASSEMBLY_STAGES_ORDER.indexOf(stageCompleted);
      const nextStageIndex = completedStageIndex + 1;

      setCurrentUnit(prevUnit => {
        if (!prevUnit) return null;

        const updatedStages = {
          ...prevUnit.stages,
          [stageCompleted]: 'complete' as 'complete',
        };

        let newCurrentAssemblyStage: AssemblyStage | null = stageCompleted; // Fallback, though should advance

        if (nextStageIndex < ASSEMBLY_STAGES_ORDER.length) {
          newCurrentAssemblyStage = ASSEMBLY_STAGES_ORDER[nextStageIndex]!;
          updatedStages[newCurrentAssemblyStage] = 'in_progress' as 'in_progress';
        } else {
          // This means the last stage was just completed
          newCurrentAssemblyStage = stageCompleted; // Keep currentStage as the last completed stage
                                                // or set to null if you prefer to signify no *active* next stage.
                                                // Backend should handle overall unit status to COMPLETE.
        }
        
        // If assembly hadn't started (prevUnit.currentStage was null) and we just completed the first stage.
        // The backend will set the next stage as current, so this logic should align.
        // The key is that `variables.stage` was the *first* stage passed.

        const initialChecks: Record<string, boolean> = {};
        if (newCurrentAssemblyStage && ASSEMBLY_STAGES_ORDER.includes(newCurrentAssemblyStage)) {
          const nextChecklistDefinition = PLACEHOLDER_CHECKLISTS[newCurrentAssemblyStage] ?? [];
          nextChecklistDefinition.forEach(task => initialChecks[task.id] = false);
        }
        setChecklistState(initialChecks);

        return {
          ...prevUnit,
          currentStage: newCurrentAssemblyStage,
          stages: updatedStages,
        };
      });

      if (nextStageIndex < ASSEMBLY_STAGES_ORDER.length) {
        setActiveStep(nextStageIndex);
      } else {
        setActiveStep(completedStageIndex); // Stay on the last step if it was completed
      }
    },
    onError: (error) => {
      setSnackbarMessage(`Error completing stage: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setIsCompletingStage(false);
    }
  });

  useEffect(() => {
    if (currentUnit) {
      const currentStageIndex = ASSEMBLY_STAGES_ORDER.indexOf(currentUnit.currentStage);
      setActiveStep(currentStageIndex >= 0 ? currentStageIndex : 0);
      const currentChecklistDefinition = PLACEHOLDER_CHECKLISTS[currentUnit.currentStage] ?? [];
      const initialChecks: Record<string, boolean> = {};
      currentChecklistDefinition.forEach(task => initialChecks[task.id] = false);
      setChecklistState(initialChecks);
    }
  }, [currentUnit]);

  const handleLoadUnit = async () => {
    const trimmedSerial = serialInput.trim();
    if (!trimmedSerial) {
      setSnackbarMessage('Please enter a serial number.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setIsLoadingUnit(true);
    try {
      const result = await fetchUnitBySerial();
      if (result.data) {
        setCurrentUnit(result.data);
        setSnackbarMessage(`Unit ${result.data.serialNumber} loaded.`);
        setSnackbarSeverity('success');
      } else if (result.error) { // Should be caught by catch block, but defensive
        setCurrentUnit(null);
        setSnackbarMessage(result.error.message || 'Failed to load unit.');
        setSnackbarSeverity('error');
      }
    } catch (error: any) {
      setCurrentUnit(null);
      setSnackbarMessage(error.message || 'An unexpected error occurred.');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
      setIsLoadingUnit(false);
    }
  };

  const handleClearUnit = () => {
    setCurrentUnit(null);
    setSerialInput('');
    setActiveStep(0);
    setChecklistState({});
    setSnackbarMessage('Ready to load new unit.');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
  };

  const handleChecklistChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecklistState({
      ...checklistState,
      [event.target.name]: event.target.checked,
    });
  };

  const handleMarkStageComplete = async () => {
    if (!currentUnit) return;

    let stageToMark: AssemblyStage;
    let checkChecklist = true;

    if (assemblyHasStarted && currentUnit.currentStage) {
      stageToMark = currentUnit.currentStage;
    } else if (!assemblyHasStarted && ASSEMBLY_STAGES_ORDER.length > 0) {
      stageToMark = ASSEMBLY_STAGES_ORDER[0]!;
      checkChecklist = false; // Don't check checklist for the very first stage if auto-starting
    } else {
      // Should not happen if currentUnit is loaded and ASSEMBLY_STAGES_ORDER is populated
      console.error("Cannot determine stage to mark complete");
      return;
    }

    if (checkChecklist) {
      const currentChecklistDefinition = PLACEHOLDER_CHECKLISTS[stageToMark] ?? [];
      const allTasksChecked = currentChecklistDefinition.length > 0 ? currentChecklistDefinition.every(task => checklistState[task.id]) : true;
      if (!allTasksChecked && currentChecklistDefinition.length > 0) {
        setSnackbarMessage("All checklist items for the current stage must be completed.");
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
    }

    setIsCompletingStage(true);
    markStageCompleteMutation.mutate({
      unitId: currentUnit.id,
      stage: stageToMark,
    });
  };

  // Placeholder for checklist data - this should be integrated with backend data if dynamic
  const PLACEHOLDER_CHECKLISTS: Record<AssemblyStage, {id: string, label: string}[]> = {
    LAP_AND_CLEAN: [ {id: 'lc1', label: 'Lap slide'}, {id: 'lc2', label: 'Clean'} ],
    PIN_EJECTOR: [ {id: 'pe1', label: 'Pin ejector'} ],
    INSTALL_EXTRACTOR: [], FIT_BARREL: [], TRIGGER_ASSEMBLY: [], BUILD_SLIDE: [], ASSEMBLE_LOWER: [], MATE_SLIDE_FRAME: [], FUNCTION_TEST: [], FINAL_QC: [], PACKAGE_AND_SERIALIZE: [],
  };

  const currentStageKey = currentUnit?.currentStage;
  const currentStageData = currentStageKey ? currentUnit?.stages[currentStageKey] : undefined;
  const currentChecklist = currentStageKey ? (PLACEHOLDER_CHECKLISTS[currentStageKey] ?? []) : [];

  const getStepIcon = (stageKey: AssemblyStage) => {
    const status = currentUnit?.stages[stageKey];
    if (status === 'complete') return <CheckCircleIcon sx={{ color: 'success.main' }} />;
    if (status === 'in_progress') return <WarningIcon sx={{ color: 'warning.main' }} />;
    return <RadioButtonUncheckedIcon />;
  };
  
  if (!currentUnit) {
    return (
        <Paper elevation={3} sx={{ p: 3, maxWidth: 500, margin: 'auto', mt: 4 }}>
            <Typography variant="h6" gutterBottom>Load Unit</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField 
                    label="Scan or Enter Serial Number"
                    variant="outlined"
                    fullWidth
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') handleLoadUnit(); }}
                />
                <IconButton color="primary" onClick={handleLoadUnit} disabled={isLoadingUnit}>
                    <QrCodeScannerIcon />
                </IconButton>
            </Stack>
            <LoadingButton 
                variant="contained" 
                onClick={handleLoadUnit} 
                loading={isLoadingUnit}
                fullWidth
            >
                Load Unit
            </LoadingButton>
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center'}}>
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Paper>
    );
  }

  return (
    <>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, m: { xs: 1, sm: 'auto'}, maxWidth: 700, touchAction: 'pan-y' }}>
        <Stack spacing={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              {currentUnit.serialNumber}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
              {currentUnit.productName}
            </Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: 2, borderColor: currentUnit.stages[currentUnit.currentStage] === 'in_progress' ? 'warning.main' : 'divider' }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ color: currentUnit.stages[currentUnit.currentStage] === 'in_progress' ? 'warning.main' : 'inherit'}}>
                Current Stage: {currentUnit.currentStage ? currentUnit.currentStage.replace(/_/g, ' ') : 'N/A'}
            </Typography>
            {currentChecklist.length > 0 && (
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{mb: 1}}>Checklist:</Typography>
                <FormGroup>
                {currentChecklist.map((item) => (
                    <FormControlLabel
                    key={item.id}
                    control={<Checkbox checked={checklistState[item.id] || false} onChange={handleChecklistChange} name={item.id} sx={{p: '4px'}}/>}
                    label={item.label}
                    sx={{ mb: 0.5, '& .MuiFormControlLabel-label': {fontSize: '0.95rem'} }} 
                    />
                ))}
                </FormGroup>
            </Box>
            )}
            <LoadingButton
                variant="contained"
                color="primary"
                size="large"
                onClick={handleMarkStageComplete}
                loading={isCompletingStage}
                disabled={(() => {
                  if (isCompletingStage) return true;
                  if (!assemblyHasStarted || !currentUnit?.currentStage) {
                    // If assembly hasn't started or currentStage is somehow null (shouldn't happen if assemblyHasStarted is true)
                    // only isCompletingStage (checked above) should disable it.
                    return false; 
                  }
                  // Assembly has started and currentStage is valid
                  if (currentUnit.stages[currentUnit.currentStage] === 'complete') return true;
                  
                  const checklist = PLACEHOLDER_CHECKLISTS[currentUnit.currentStage] ?? [];
                  if (checklist.length > 0) {
                    const allChecked = checklist.every(task => !!checklistState[task.id]);
                    if (!allChecked) return true;
                  }
                  return false; // Default to not disabled if no other conditions met
                })()}
                fullWidth
                sx={{ minHeight: '48px'}}
            >
              {!assemblyHasStarted 
                ? (ASSEMBLY_STAGES_ORDER.length > 0 ? `Start Assembly (Begin ${ASSEMBLY_STAGES_ORDER[0]!.replace(/_/g, ' ')})` : 'No Stages Defined')
                : (currentUnit?.currentStage && currentUnit.stages[currentUnit.currentStage] === 'complete' 
                    ? 'Stage Already Completed' 
                    : `Mark ${currentUnit?.currentStage?.replace(/_/g, ' ') ?? 'Current Stage'} Complete`)
              }
            </LoadingButton>
          </Paper>

          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2}}>Overall Progress</Typography>
            <Box sx={{ overflowX: 'auto', pb: 1 }}>
              <Stepper activeStep={activeStep} alternativeLabel connector={<CustomStepConnector />}>
                {ASSEMBLY_STAGES_ORDER.map((stageKey) => (
                  <Step key={stageKey} completed={currentUnit.stages[stageKey] === 'complete'}>
                    <StepLabel StepIconComponent={() => getStepIcon(stageKey)}>
                      {stageKey ? stageKey.replace(/_/g, ' ') : 'Unknown Stage'}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </Box>
        </Stack>

        <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center'}}>
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
        <Button 
          variant="outlined" 
          color="secondary" 
          size="medium" 
          onClick={handleClearUnit}
        >
          Load Different Unit
        </Button>
      </Box>
    </>
  );
} 