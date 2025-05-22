"use client";

import { api } from "~/trpc/react";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";

export function BatchList() {
  const { data: batches, isLoading, error } = api.batch.getAllBatches.useQuery();

  type SerializedItem = {
    id: string;
    serialNumber: string;
    status: string;
    currentStage?: string | null;
  };
  type Batch = {
    id: string;
    status: string;
    serializedItems: SerializedItem[];
    completedCount: number;
    progressPercent: number;
  };

  if (isLoading) return <div>Loading batches...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!batches || batches.length === 0) return <div>No batches found.</div>;

  return (
    <div className="space-y-4">
      {batches.map((batch: Batch) => (
        <Card key={batch.id} className="p-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="font-bold">Batch ID: {batch.id}</div>
              <div>Status: {batch.status}</div>
            </div>
            <div>
              <span className="text-sm">
                {batch.completedCount} / {batch.serializedItems.length} complete
              </span>
            </div>
          </div>
          <Progress value={batch.progressPercent} className="mb-2" />
          <div>
            <span className="font-semibold">Serialized Items:</span>
            <ul className="list-disc ml-6">
              {batch.serializedItems.map((item: SerializedItem) => (
                <li key={item.id}>
                  {item.serialNumber} - {item.status}
                  {item.currentStage && ` (Stage: ${item.currentStage})`}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      ))}
    </div>
  );
} 