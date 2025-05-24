'use client';

import React, { useState } from 'react';
import { api } from '~/trpc/react';
import { 
    Box, 
    Typography, 
    Paper, 
    Grid, 
    CircularProgress, 
    Alert, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    Card, 
    CardContent
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { TimePeriod } from '~/server/api/routers/dashboard'; // Import the type
import { AssemblyStage } from '@prisma/client';

// Helper to format assembly stage names
const formatStageName = (stage: AssemblyStage | string) => {
    return stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const MetricCard = ({ title, value, isLoading }: { title: string, value: string | number, isLoading?: boolean }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                {title}
            </Typography>
            {isLoading ? <CircularProgress size={24} /> : 
                <Typography variant="h4" component="p" sx={{ fontWeight: 'bold' }}>
                    {value}
                </Typography>
            }
        </CardContent>
    </Card>
);

const BarChart = ({ data, title }: { data: { label: string, value: number }[], title: string }) => {
    // Filter out items with value 0 for cleaner display, unless all items are 0
    const hasNonZeroData = data.some(d => d.value > 0);
    const displayData = hasNonZeroData ? data.filter(d => d.value > 0) : [];
    
    const maxValue = Math.max(...displayData.map(d => d.value), 0);

    return (
        <Paper elevation={2} sx={{ p: 2, mt: 2, minHeight: 150 /* Ensure a minimum height */ }}>
            <Typography variant="h6" gutterBottom sx={{textAlign: 'center'}}>{title}</Typography>
            {displayData.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {displayData.map(item => (
                        <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ width: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.label}>
                                {formatStageName(item.label)}
                            </Typography>
                            <Box sx={{ flexGrow: 1, height: '20px', backgroundColor: 'grey.200', borderRadius: '4px' }}>
                                <Box sx={{
                                    height: '100%',
                                    width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                                    backgroundColor: 'primary.main',
                                    borderRadius: '4px',
                                    transition: 'width 0.3s ease-in-out'
                                }} />
                            </Box>
                            <Typography variant="body2" sx={{ minWidth: '30px', textAlign: 'right' }}>{item.value}</Typography>
                        </Box>
                    ))}
                </Box>
            ) : (
                <Typography sx={{textAlign: 'center', mt: 2, fontStyle: 'italic', color: 'text.secondary'}}>
                    {title.toLowerCase().includes('rejection') ? 'No rejections recorded for this period.' : 'No data to display for this period.'}
                </Typography>
            )}
        </Paper>
    );
};

export default function DashboardPage() {
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('this_week');

    const { data: productionData, isLoading: isLoadingProduction, error: errorProduction } = 
        api.dashboard.getProductionSummary.useQuery({ timePeriod });

    const { data: rejectionData, isLoading: isLoadingRejection, error: errorRejection } = 
        api.dashboard.getRejectionSummary.useQuery({ timePeriod });

    const { data: wipData, isLoading: isLoadingWip, error: errorWip } = 
        api.dashboard.getWipByStage.useQuery(); // WIP is always current, no time period needed

    const handleTimePeriodChange = (event: SelectChangeEvent<TimePeriod>) => {
        setTimePeriod(event.target.value as TimePeriod);
    };

    if (errorProduction || errorRejection || errorWip) {
        return <Alert severity="error">Error loading dashboard data. {(errorProduction || errorRejection || errorWip)?.message}</Alert>;
    }

    const rejectionsByStageForChart = rejectionData?.rejectionsByStage
        // No longer pre-filter here, let BarChart component handle display of zero/empty data
        .map(rs => ({ label: rs.stage, value: rs.count })) ?? [];

    const wipByStageForChart = wipData?.wipByStage
        // No longer pre-filter here, let BarChart component handle display of zero/empty data
        .map(ws => ({ label: ws.stage, value: ws.count })) ?? [];

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    Assembly Dashboard
                </Typography>
                <FormControl sx={{ minWidth: 150 }} size="small">
                    <InputLabel id="time-period-select-label">Time Period</InputLabel>
                    <Select
                        labelId="time-period-select-label"
                        id="time-period-select"
                        value={timePeriod}
                        label="Time Period"
                        onChange={handleTimePeriodChange}
                    >
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="this_week">This Week</MenuItem>
                        <MenuItem value="all_time">All Time</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Grid container spacing={3}>
                <Grid xs={12} sm={6} md={3}>
                    <MetricCard title="Units Completed" value={productionData?.unitsCompleted ?? 'N/A'} isLoading={isLoadingProduction} />
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <MetricCard title="Units In Progress" value={productionData?.unitsInProgress ?? 'N/A'} isLoading={isLoadingProduction} />
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                    <MetricCard title="Total Rejections" value={rejectionData?.totalRejections ?? 'N/A'} isLoading={isLoadingRejection} />
                </Grid>
                {/* Add more MetricCards here if needed for other top-level stats */}
            </Grid>

            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid xs={12} md={6}>
                    {isLoadingWip ? <CircularProgress /> : 
                        <BarChart data={wipByStageForChart} title="Work In Progress by Stage (Current)" />
                    }
                </Grid>
                <Grid xs={12} md={6}>
                    {isLoadingRejection ? <CircularProgress /> : 
                        <BarChart data={rejectionsByStageForChart} title={`Rejections by Stage (${timePeriod.replace(/_/g, ' ')})`} />
                    }
                </Grid>
            </Grid>
        </Box>
    );
} 