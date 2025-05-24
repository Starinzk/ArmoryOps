'use client';

import { useState } from 'react';
import { api } from '~/trpc/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper'; // For the info box
import InfoIcon from '@mui/icons-material/Info'; // For the info icon
import IconButton from '@mui/material/IconButton'; // Import IconButton
import CloseIcon from '@mui/icons-material/Close'; // Import Close icon

// Placeholder product models - replace with your actual data source
const productModels = [
  { id: 'model-a', name: 'Product Model A' },
  { id: 'model-b', name: 'Product Model B' },
  { id: 'model-c', name: 'Product Model C' },
];

interface CreateBatchFormProps {
  open: boolean;
  onClose: () => void;
  userEmail?: string;
}

export function CreateBatchForm({ open, onClose, userEmail }: CreateBatchFormProps) {
  const [productModel, setProductModel] = useState('');
  const [batchNumber, setBatchNumber] = useState(''); // Corresponds to 'name' in API
  const [quantity, setQuantity] = useState<number | ''>(50); // Default to 50 as in design
  const [serialNumbersInput, setSerialNumbersInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const utils = api.useUtils();

  const createBatchMutation = api.batch.createBatch.useMutation({
    onSuccess: async () => {
      await utils.batch.getAllBatches.invalidate(); // Invalidate batch list to refetch
      // alert('Batch created successfully!'); // Placeholder
      setProductModel('');
      setBatchNumber('');
      setQuantity(50);
      setSerialNumbersInput('');
      setFormError(null);
      onClose(); // Close the dialog
    },
    onError: (error) => {
      setFormError(error.message);
      // alert(`Error creating batch: ${error.message}`); // Placeholder
    },
  });

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuantity(value === '' ? '' : Number(value));
  };

  const handleProductModelChange = (event: SelectChangeEvent<string>) => {
    setProductModel(event.target.value as string);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null); // Clear previous errors

    const serials = serialNumbersInput
      .split(/[\s,;\n]+/) // Split by spaces, commas, semicolons, or newlines
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (!productModel) {
      setFormError('Product Model is required.');
      return;
    }
    if (!batchNumber) {
      setFormError('Batch Number is required.');
      return;
    }
    if (quantity === '' || quantity <= 0) {
      setFormError('Quantity must be a positive number.');
      return;
    }

    // Validation based on design: "Each serial number must be 5 digits."
    if (serials.length > 0) {
      for (const serial of serials) {
        if (!/^\d{5}$/.test(serial)) {
          setFormError('Each serial number must be exactly 5 digits. Please check your input.');
          return;
        }
      }
      // "If provided, enter 50 numbers" (or whatever quantity is set)
      if (serials.length !== quantity) {
         setFormError(`You have entered ${serials.length} serial numbers, but the quantity is set to ${quantity}. Please ensure they match or clear serial numbers to assign later.`);
         return;
      }
    }


    createBatchMutation.mutate({
      name: batchNumber,
      productModel,
      quantity: Number(quantity), // Ensure quantity is a number
      serialNumbers: serials.length > 0 ? serials : undefined, // Send undefined if no serials
    });
  };

  const handleCloseDialog = () => {
    if (createBatchMutation.isPending) return; // Don't close if submitting
    setProductModel('');
    setBatchNumber('');
    setQuantity(50);
    setSerialNumbersInput('');
    setFormError(null);
    onClose();
  };


  return (
    <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Create New Batch
        </Typography>
        {userEmail && (
          <Typography variant="caption" sx={{ px: 2, color: 'text.secondary' }}>
            {userEmail}
          </Typography>
        )}
        <IconButton
          aria-label="close"
          onClick={handleCloseDialog} // Use the existing handler
          sx={{
            // position: 'absolute', // If you want it absolutely positioned
            // right: 8,
            // top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers /* Adds a top divider */ >
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ pt: 1 }}> {/* Add some padding top */}
          <Stack spacing={2.5} /* sx={{ mt: 1 }} removed, using DialogContent padding */ >
            <FormControl fullWidth required disabled={createBatchMutation.isPending}>
              <InputLabel id="product-model-select-label">Product Model</InputLabel>
              <Select
                labelId="product-model-select-label"
                id="product-model-select"
                value={productModel}
                label="Product Model"
                onChange={handleProductModelChange}
              >
                <MenuItem value="">
                  <em>Select a product model</em>
                </MenuItem>
                {productModels.map((model) => (
                  <MenuItem key={model.id} value={model.name}> {/* Using name as value for now */}
                    {model.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Batch Number"
              placeholder="e.g., XXX, 130"
              helperText="Format: XXX (e.g., 130)"
              variant="outlined"
              fullWidth
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              required
              disabled={createBatchMutation.isPending}
            />
            <TextField
              label="Quantity"
              type="number"
              variant="outlined"
              fullWidth
              value={quantity}
              onChange={handleQuantityChange}
              required
              InputProps={{ inputProps: { min: 1 } }}
              disabled={createBatchMutation.isPending}
            />
            
            <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>Serial Numbers (Optional)</Typography>
            <Paper elevation={0} sx={{ p: 1.5, backgroundColor: '#fff9c4', display: 'flex', alignItems: 'center', gap: 1, borderRadius:1 }}>
              <InfoIcon fontSize="small" sx={{color: '#f57f17'}} />
              <Typography variant="caption" sx={{color: '#5d4037'}}>
                <strong>Important:</strong> Serial numbers will be assigned to items in the exact order they are entered here, matching the sequential item number order (e.g., first serial number → item 001, second → item 002, etc.). Each serial number must be 5 digits.
              </Typography>
            </Paper>

            <TextField
              label="Enter serial numbers"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              value={serialNumbersInput}
              onChange={(e) => setSerialNumbersInput(e.target.value)}
              disabled={createBatchMutation.isPending}
              placeholder="Enter serial numbers (separated by spaces, newlines, or commas)"
              helperText="Each serial number must be 5 digits. If provided, the count must match Quantity. Leave empty to assign serial numbers later."
            />
            
            {formError && (
              <Alert severity="error" sx={{width: '100%'}}>{formError}</Alert>
            )}
             {createBatchMutation.error && !formError && ( // Show mutation error if not already handled by formError
              <Alert severity="error" sx={{width: '100%'}}>{createBatchMutation.error.message}</Alert>
            )}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{p: '16px 24px'}}>
        <Button onClick={handleCloseDialog} disabled={createBatchMutation.isPending} color="inherit">
          Cancel
        </Button>
        <Button
          type="submit" // Will trigger form onSubmit
          variant="contained"
          color="primary"
          onClick={() => document.querySelector<HTMLFormElement>('form[novalidate]')?.requestSubmit()} // Programmatically submit the form
          disabled={createBatchMutation.isPending}
          startIcon={createBatchMutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {createBatchMutation.isPending ? 'Creating Batch...' : 'Create Batch'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 