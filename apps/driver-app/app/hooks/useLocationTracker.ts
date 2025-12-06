import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { LocationUpdateDto } from '../types/dtos';

type TrackingStatus = 'idle' | 'tracking' | 'error';

export function useLocationTracker() {
	const { user, isAuthenticated } = useAuth();
	const [status, setStatus] = useState<TrackingStatus>('idle');
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!isAuthenticated || !user?.vehicleId) {
			return;
		}

		setStatus('tracking');
		let watchId: number;

		const successHandler = async (position: GeolocationPosition) => {
			try {
				const { latitude, longitude, speed, heading, accuracy } = position.coords;
				const payload: LocationUpdateDto = {
					vehicleId: user.vehicleId,
					latitude,
					longitude,
					speed: speed ?? 0,
					heading: heading ?? 0,
					accuracy,
					isMocked: false, // In a real native app, we'd detect this
					timestamp: new Date(position.timestamp),
				};

				// Send to backend
				// Note: In production, we might throttle this or batch it
				// The Endpoint is: POST /api/v1/telematics/location/track
				await api.post('/api/v1/telematics/location/track', payload);

				setError(null);
			} catch (err) {
				console.error('Failed to send location update:', err);
				// We don't change status to error here to keep retrying silent
			}
		};

		const errorHandler = (err: GeolocationPositionError) => {
			console.error('Geolocation error:', err);
			setError(err.message);
			setStatus('error');
		};

		if ('geolocation' in navigator) {
			watchId = navigator.geolocation.watchPosition(
				successHandler,
				errorHandler,
				{
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 0
				}
			);
		} else {
			setError('Geolocation not supported');
			setStatus('error');
		}

		return () => {
			if (watchId) {
				navigator.geolocation.clearWatch(watchId);
			}
		};
	}, [isAuthenticated, user?.vehicleId]);

	return { status, error };
}
