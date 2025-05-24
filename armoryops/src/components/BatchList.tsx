"use client";

import Link from 'next/link';
import { api, type RouterOutputs } from "~/trpc/react";
import { Card, CardActionArea, CardContent } from '@mui/material';
import { Progress } from "~/components/ui/progress";
import { Typography, Box } from '@mui/material';

export function BatchList() {
  const { data: batches, isLoading, error } = api.batch.getAllBatches.useQuery();

  // Use the inferred output type from the tRPC router
  type BatchFromAPI = RouterOutputs['batch']['getAllBatches'][number];

  if (isLoading) return <Typography sx={{ textAlign: 'center', mt: 4 }}>Loading batches...</Typography>;
  if (error) return <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>Error: {error.message}</Typography>;
  if (!batches || batches.length === 0) return <Typography sx={{ textAlign: 'center', mt: 4 }}>No batches found.</Typography>;

  return (
    <div className="space-y-4 mt-6">
      {batches.map((batch: BatchFromAPI) => (
        <Link href={`/batch/${batch.id}`} key={batch.id} passHref legacyBehavior>
          <Card component="a" sx={{ textDecoration: 'none' }}>
            <CardActionArea>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                      {batch.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Product Model: {batch.productModel}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {batch.status}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      {batch.completedCount} / {batch.quantity} items
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {batch.progressPercent}% complete
                    </Typography>
                  </Box>
                </Box>
                <Progress value={batch.progressPercent} className="h-2" />
              </CardContent>
            </CardActionArea>
          </Card>
        </Link>
      ))}
    </div>
  );
} 