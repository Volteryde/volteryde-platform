'use client';
import PageContainer from '@/components/container/PageContainer';
import DashboardCard from '@/app/components/shared/DashboardCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const ChargingModule = () => {
    // Mock Data
    const stations = [
        { id: 'st-001', name: 'Downtown Hub', location: 'Accra Central', status: 'Available', ports: 8, occupied: 2, power: '150kW' },
        { id: 'st-002', name: 'Circle Interchange', location: 'Kwame Nkrumah Circle', status: 'Occupied', ports: 4, occupied: 4, power: '50kW' },
        { id: 'st-003', name: 'Airport City', location: 'Kotoka Int. Airport', status: 'Maintenance', ports: 6, occupied: 0, power: '150kW' },
        { id: 'st-004', name: 'Tema Port', location: 'Tema Main Harbor', status: 'Available', ports: 10, occupied: 5, power: '350kW' },
    ];

    return (
        <PageContainer title="Charging Infrastructure" description="Monitor charging station status and energy usage">
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <Card className="lg:col-span-2 overflow-hidden border-none shadow-md bg-white dark:bg-gray-800">
                    <div className="flex flex-col md:flex-row h-full">
                        <div className="p-8 flex-1 flex flex-col justify-center">
                            <Badge variant="outline" className="w-fit mb-4 border-green-500 text-green-600 dark:border-green-400 dark:text-green-400">
                                Live Network Status
                            </Badge>
                            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Operating at High Efficiency</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                Real-time monitoring of power output and station availability across all Volteryde locations.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                                    <span className="block text-2xl font-bold text-primary">550kW</span>
                                    <span className="text-sm text-primary/80 font-medium">Total Power Output</span>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <span className="block text-2xl font-bold text-blue-700 dark:text-blue-400">28/48</span>
                                    <span className="text-sm text-blue-600 dark:text-blue-300 font-medium">Active Charging Ports</span>
                                </div>
                            </div>
                        </div>
                        <div className="md:w-2/5 relative min-h-[250px] bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10">
                            {/* Illustration Container */}
                            <div className="absolute inset-0 p-0 flex items-center justify-center">
                                <img
                                    src="/images/backgrounds/charging-illustration.png"
                                    alt="EV Charging Station Illustration"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Network Health Card */}
                <Card className="shadow-md border-none bg-white dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-white">Fleet Charging Health</CardTitle>
                        <CardDescription className="text-gray-500 dark:text-gray-400">Current utilization metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-gray-600 dark:text-gray-300">Available Stations</span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">65%</span>
                                </div>
                                <Progress value={65} className="h-2 bg-gray-100 dark:bg-gray-700" variant="primary" />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                        <span className="text-gray-600 dark:text-gray-300">Occupied</span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">25%</span>
                                </div>
                                <Progress value={25} className="h-2 bg-gray-100 dark:bg-gray-700" variant="warning" />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <span className="text-gray-600 dark:text-gray-300">Maintenance</span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">10%</span>
                                </div>
                                <Progress value={10} className="h-2 bg-gray-100 dark:bg-gray-700" variant="error" />
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span>Optimization Score</span>
                                <span className="text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">94/100</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <DashboardCard title="Station Network Locations">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {stations.map((station) => (
                        <Card key={station.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800 dark:border-gray-700">
                            <div className={`h-1 w-full ${station.status === 'Available' ? 'bg-green-500' :
                                station.status === 'Occupied' ? 'bg-yellow-400' : 'bg-red-500'
                                }`} />
                            <CardHeader className="pb-3 pt-4">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className={`${station.status === 'Available' ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                                        station.status === 'Occupied' ? 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' :
                                            'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                        }`}>
                                        {station.status}
                                    </Badge>
                                    <span className="text-xs font-semibold text-gray-400 border px-1.5 py-0.5 rounded dark:border-gray-600">{station.power}</span>
                                </div>
                                <CardTitle className="text-lg text-gray-800 dark:text-gray-100">{station.name}</CardTitle>
                                <CardDescription className="text-gray-500 dark:text-gray-400">{station.location}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                                            <span>Port Utilization</span>
                                            <span>{station.occupied}/{station.ports}</span>
                                        </div>
                                        {/* Progress bar logic based on status */}
                                        <Progress
                                            value={(station.occupied / station.ports) * 100}
                                            className="h-1.5 bg-gray-100 dark:bg-gray-700"
                                            variant={
                                                station.status === 'Available' ? 'primary' :
                                                    station.status === 'Occupied' ? 'warning' : 'error'
                                            }
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </DashboardCard>
        </PageContainer>
    );
};

export default ChargingModule;
