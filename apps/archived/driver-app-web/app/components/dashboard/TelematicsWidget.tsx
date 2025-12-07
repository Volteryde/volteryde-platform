"use client";

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { DiagnosticsResponseDto } from '../../types/dtos';

export function TelematicsWidget() {
	const { user } = useAuth();
	const [data, setData] = useState<DiagnosticsResponseDto | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!user?.vehicleId) return;

		const fetchData = async () => {
			try {
				// GET /api/v1/telematics/diagnostics/:vehicleId
				const result = await api.get<DiagnosticsResponseDto>(`/api/v1/telematics/diagnostics/${user.vehicleId}`);
				setData(result);
			} catch (err) {
				console.error('Failed to fetch telematics:', err);
			} finally {
				setLoading(false);
			}
		};

		// Initial fetch
		fetchData();

		// Poll every 5 seconds
		const interval = setInterval(fetchData, 5000);
		return () => clearInterval(interval);
	}, [user?.vehicleId]);

	if (loading && !data) {
		return (
			<div className="grid grid-cols-4 gap-6 animate-pulse">
				{[1, 2, 3, 4].map(i => (
					<div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
				))}
			</div>
		);
	}

	// Fallback if no data (e.g. API error or vehicle offline)
	const displayData = data || {
		batteryLevel: 0,
		rangeKm: 0,
		speed: 0,
		isCharging: false,
		temperature: 0,
	};

	return (
		<div className="grid grid-cols-4 gap-6">
			{/* Seats Occupied (Hardcoded for now as it wasn't in diagnostics DTO yet, but keeping UI consistent) */}
			<div className="flex items-center gap-3">
				<svg
					className="w-6 h-6 text-gray-600"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
				<div>
					<p className="text-xs text-gray-600">Seats Occupied</p>
					<p className="text-xl font-bold text-gray-900">32 / 45</p>
					<p className="text-xs text-brand-secondary">
						13 Seat Available
					</p>
				</div>
			</div>

			{/* Battery Level */}
			<div className="flex items-center gap-3">
				<svg
					className={`w-6 h-6 ${displayData.batteryLevel < 20 ? 'text-red-500' : 'text-gray-600'}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
					/>
				</svg>
				<div>
					<p className="text-xs text-gray-600">Battery Level</p>
					<p className="text-xl font-bold text-gray-900">{displayData.batteryLevel}%</p>
					<div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
						<div
							className={`h-full rounded-full ${displayData.batteryLevel < 20 ? 'bg-red-500' : 'bg-brand-secondary'}`}
							style={{ width: `${displayData.batteryLevel}%` }}
						></div>
					</div>
				</div>
			</div>

			{/* Distance to Next Stop */}
			<div className="flex items-center gap-3">
				<svg
					className="w-6 h-6 text-gray-600"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
					/>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
				<div>
					<p className="text-xs text-gray-600">
						Speed
					</p>
					<p className="text-xl font-bold text-gray-900">{displayData.speed} km/h</p>
					<p className="text-xs text-gray-600">Range: {displayData.rangeKm} km</p>
				</div>
			</div>

			{/* Estimated Arrival Time (Keeping mock for now) */}
			<div className="flex items-center gap-3">
				<svg
					className="w-6 h-6 text-gray-600"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div>
					<p className="text-xs text-gray-600">
						Estimated Arrival Time
					</p>
					<p className="text-xl font-bold text-gray-900">2 min</p>
				</div>
			</div>
		</div>
	);
}
