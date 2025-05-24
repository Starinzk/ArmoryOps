'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

// Mock data (replace with actual data fetching/props)
interface UnitData {
  id: string;
  serialNumber: string;
  productName: string;
  currentStage: string; // e.g., 'LAP_AND_CLEAN'
  stages: {
    [key: string]: {
      status: 'not_started' | 'in_progress' | 'complete';
      checklist?: { id: string; label: string; checked: boolean }[];
    };
  };
}

const MOCK_STAGES_ORDER = [
  'LAP_AND_CLEAN',
  'PIN_EJECTOR',
  'INSTALL_EXTRACTOR',
  'FIT_BARREL',
  'TRIGGER_ASSEMBLY',
  'BUILD_SLIDE',
];

const MOCK_UNIT_DATA: UnitData = {
  id: 'unit123',
  serialNumber: '130-001',
  productName: 'GLK-19 Gen 5',
  currentStage: 'LAP_AND_CLEAN',
  stages: {
    LAP_AND_CLEAN: {
      status: 'in_progress',
      checklist: [
        { id: 'lc1', label: 'Lap slide to frame', checked: false },
        { id: 'lc2', label: 'Clean debris', checked: false },
      ],
    },
    PIN_EJECTOR: {
      status: 'not_started',
      checklist: [{ id: 'pe1', label: 'Verify ejector pin', checked: false }],
    },
    INSTALL_EXTRACTOR: {
      status: 'not_started',
    },
    FIT_BARREL: {
        status: 'not_started',
    },
    TRIGGER_ASSEMBLY: {
        status: 'not_started',
    },
    BUILD_SLIDE: {
        status: 'not_started',
    },
  },
};

interface AssemblyProgressPanelProps {
  // unitData?: UnitData; // Optional: pass unit data directly
  // onStageComplete?: (unitId: string, stage: string, userId: string) => Promise<void>; // Mock API call
}

export default function AssemblyProgressPanel({}: AssemblyProgressPanelProps) {
  const theme = useTheme();
  const [currentUnit, setCurrentUnit] = useState<UnitData | null>(null);
  const [serialInput, setSerialInput] = useState('');
  const [isLoadingUnit, setIsLoadingUnit] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [isCompletingStage, setIsCompletingStage] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');

  const orderedStageKeys = useMemo(() => {
    if (!currentUnit) return [];
    // This should ideally come from a predefined order or unitData itself
    return MOCK_STAGES_ORDER.filter(stage => currentUnit.stages[stage]);
  }, [currentUnit]);

  useEffect(() => {
    if (currentUnit) {
      const currentStageIndex = orderedStageKeys.indexOf(currentUnit.currentStage);
      setActiveStep(currentStageIndex >= 0 ? currentStageIndex : 0);

      const stageData = currentUnit.stages[currentUnit.currentStage];
      if (stageData?.checklist) {
        const initialChecks: Record<string, boolean> = {};
        stageData.checklist.forEach(item => initialChecks[item.id] = item.checked);
        setChecklistState(initialChecks);
      }
    }
  }, [currentUnit, orderedStageKeys]);

  const handleLoadUnit = async () => {
    if (!serialInput.trim()) {
        setSnackbarMessage('Please enter a serial number or item ID.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
    }
    setIsLoadingUnit(true);
    // --- Mock API call to fetch unit data by serialInput ---
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    // Replace with actual API call: e.g., api.assembly.getUnitBySerial.useQuery or a mutation
    // For mock purposes, allow loading by serial number OR a specific batch-item index like "131-1"
    if (serialInput === MOCK_UNIT_DATA.serialNumber || serialInput === '131-1') { 
        setCurrentUnit(MOCK_UNIT_DATA);
        setSnackbarMessage(`Unit ${MOCK_UNIT_DATA.serialNumber} loaded (input: ${serialInput}).`);
        setSnackbarSeverity('success');
    } else {
        setCurrentUnit(null);
        setSnackbarMessage('Unit not found.');
        setSnackbarSeverity('error');
    }
    setSnackbarOpen(true);
    setIsLoadingUnit(false);
  };

  const handleChecklistChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecklistState({
      ...checklistState,
      [event.target.name]: event.target.checked,
    });
  };

  const handleMarkStageComplete = async () => {
    if (!currentUnit || !currentUnit.currentStage) return;

    setIsCompletingStage(true);
    // --- Mock API call ---
    // await onStageComplete?.(currentUnit.id, currentUnit.currentStage, 'mockUserId');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    
    const currentStageIndex = orderedStageKeys.indexOf(currentUnit.currentStage);
    const nextStageIndex = currentStageIndex + 1;

    setCurrentUnit(prevUnit => {
      if (!prevUnit) return null;
      const updatedStages = {
        ...prevUnit.stages,
        [prevUnit.currentStage]: {
          ...prevUnit.stages[prevUnit.currentStage],
          status: 'complete' as 'complete',
        },
      };
      let nextStageKey = prevUnit.currentStage;
      if (nextStageIndex < orderedStageKeys.length) {
        nextStageKey = orderedStageKeys[nextStageIndex]!;
        updatedStages[nextStageKey] = {
          ...(updatedStages[nextStageKey] || {}),
          status: 'in_progress' as 'in_progress',
        };
         // Reset checklist for the new stage
        const nextStageData = updatedStages[nextStageKey];
        if (nextStageData?.checklist) {
            const initialChecks: Record<string, boolean> = {};
            nextStageData.checklist.forEach(item => initialChecks[item.id] = false); // Reset to false
            setChecklistState(initialChecks);
        }
      }
      return {
        ...prevUnit,
        currentStage: nextStageKey,
        stages: updatedStages,
      };
    });

    if (nextStageIndex < orderedStageKeys.length) {
        setActiveStep(nextStageIndex);
    }

    setSnackbarMessage('Stage marked complete!');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    setIsCompletingStage(false);
  };

  const currentStageDetails = currentUnit?.stages[currentUnit.currentStage];
  const currentChecklist = currentStageDetails?.checklist ?? [];
  const allTasksChecked = currentChecklist.length > 0 ? currentChecklist.every(task => checklistState[task.id]) : true;

  const getStepIcon = (stageKey: string) => {
    const status = currentUnit?.stages[stageKey]?.status;
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
    <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, m: { xs: 1, sm: 'auto'}, maxWidth: 700, touchAction: 'pan-y' /* for touchscreens */ }}>
      <Stack spacing={3}>
        {/* Top: Serial + Product Name */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
            {currentUnit.serialNumber}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {currentUnit.productName}
          </Typography>
        </Box>

        {/* Middle: Current Stage Card */}
        <Paper variant="outlined" sx={{ p: 2, borderColor: currentStageDetails?.status === 'in_progress' ? 'warning.main' : 'divider' }}>
            <Typography variant="h6" component="h2" gutterBottom sx={{ color: currentStageDetails?.status === 'in_progress' ? 'warning.main' : 'inherit'}}>
                Current Stage: {currentUnit.currentStage.replace(/_/g, ' ')}
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
                    sx={{ mb: 0.5, '& .MuiFormControlLabel-label': {fontSize: '0.95rem'} }} // Ensure touch target by label padding
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
                disabled={!allTasksChecked || isCompletingStage || currentStageDetails?.status === 'complete'}
                fullWidth
                sx={{ minHeight: '48px'}} // Ensure touch target size
            >
                {currentStageDetails?.status === 'complete' ? 'Stage Already Completed' : 'Mark Current Stage Complete'}
            </LoadingButton>
        </Paper>

        {/* Bottom: Stepper showing overall stage progress */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ mb: 2}}>Overall Progress</Typography>
          <Stepper activeStep={activeStep} alternativeLabel>
            {orderedStageKeys.map((label, index) => (
              <Step key={label} completed={currentUnit.stages[label]?.status === 'complete'}>
                <StepLabel StepIconComponent={() => getStepIcon(label)}>
                  {label.replace(/_/g, ' ')}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Stack>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center'}}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
} 