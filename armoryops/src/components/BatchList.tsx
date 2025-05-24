"use client";

import { api, type RouterOutputs } from "~/trpc/react";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Typography } from "@mui/material";

export function BatchList() {
  const { data: batches, isLoading, error } = api.batch.getAllBatches.useQuery();

  // Corresponds to prisma model SerializedItem, only fields used in render
  type SerializedItem = RouterOutputs['batch']['getAllBatches'][number]['serializedItems'][number];

  // Use the inferred output type from the tRPC router
  type BatchFromAPI = RouterOutputs['batch']['getAllBatches'][number];

  if (isLoading) return <div>Loading batches...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!batches || batches.length === 0) return <div>No batches found.</div>;

  return (
    <div className="space-y-4 mt-6">
      {batches.map((batch: BatchFromAPI) => (
        <Card key={batch.id} className="p-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="font-bold">Batch Name: {batch.name}</div>
              <Typography variant="body2" color="textSecondary">Product Model: {batch.productModel}</Typography>
              <Typography variant="body2" color="textSecondary">Status: {batch.status}</Typography>
            </div>
            <div>
              <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'right' }}>
                {batch.completedCount} / {batch.quantity} items
                <br />
                {batch.progressPercent}% complete
              </Typography>
            </div>
          </div>
          <Progress value={batch.progressPercent} className="mb-2" />
          {batch.serializedItems && batch.serializedItems.length > 0 ? (
            <div>
              <Typography variant="subtitle2" sx={{mt:1, mb:0.5}}>Serialized Items:</Typography>
              <ul className="list-disc ml-6 text-sm">
                {batch.serializedItems.map((item) => (
                  <li key={item.id}>
                    {item.serialNumber} - {item.status}
                    {item.currentStage && ` (Stage: ${item.currentStage})`}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Typography variant="caption" color="textSecondary">No serialized items assigned to this batch yet.</Typography>
          )}
        </Card>
      ))}
    </div>
  );
} 