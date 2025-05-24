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
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

interface CreateProductFormProps {
  open: boolean;
  onClose: () => void;
}

export function CreateProductForm({ open, onClose }: CreateProductFormProps) {
  const [name, setName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const utils = api.useUtils();

  const createProductMutation = api.product.create.useMutation({
    onSuccess: async () => {
      await utils.product.getAllProducts.invalidate(); // To refresh the list in CreateBatchForm
      await utils.product.getAll.invalidate(); // If you have a general product list elsewhere
      setName('');
      setModelNumber('');
      setDescription('');
      setImageUrl('');
      setFormError(null);
      onClose();
    },
    onError: (error) => {
      setFormError(error.message);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!name) {
      setFormError('Product Name is required.');
      return;
    }
    if (!modelNumber) {
      setFormError('Model Number is required.');
      return;
    }
    // Basic URL validation for imageUrl if provided
    if (imageUrl) {
      try {
        new URL(imageUrl);
      } catch (_) {
        setFormError('Invalid Image URL.');
        return;
      }
    }

    createProductMutation.mutate({
      name,
      modelNumber,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
    });
  };

  const handleCloseDialog = () => {
    if (createProductMutation.isPending) return;
    setName('');
    setModelNumber('');
    setDescription('');
    setImageUrl('');
    setFormError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Create New Product
        </Typography>
        <IconButton aria-label="close" onClick={handleCloseDialog}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ pt: 1 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Product Name"
              variant="outlined"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={createProductMutation.isPending}
            />
            <TextField
              label="Model Number"
              variant="outlined"
              fullWidth
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
              required
              disabled={createProductMutation.isPending}
            />
            <TextField
              label="Description (Optional)"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createProductMutation.isPending}
            />
            <TextField
              label="Image URL (Optional)"
              variant="outlined"
              fullWidth
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={createProductMutation.isPending}
              type="url"
              helperText="Must be a valid URL (e.g., https://example.com/image.png)"
            />
            {formError && (
              <Alert severity="error" sx={{ width: '100%' }}>{formError}</Alert>
            )}
            {createProductMutation.error && !formError && (
              <Alert severity="error" sx={{ width: '100%' }}>{createProductMutation.error.message}</Alert>
            )}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={handleCloseDialog} disabled={createProductMutation.isPending} color="inherit">
          Cancel
        </Button>
        <Button
          type="submit" // Will trigger form onSubmit
          variant="contained"
          color="primary"
          onClick={() => document.querySelector<HTMLFormElement>('form[novalidate]')?.requestSubmit()} // Programmatically submit the form
          disabled={createProductMutation.isPending || !name || !modelNumber}
          startIcon={createProductMutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {createProductMutation.isPending ? 'Creating Product...' : 'Create Product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 