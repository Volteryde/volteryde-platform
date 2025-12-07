import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import clsx from 'clsx';
import { Clock, MapPin, Navigation } from 'lucide-react-native';

interface TripSummaryProps {
	remainingTime?: string;
	remainingDistance?: string;
	eta?: string;
	onEndTrip?: () => void;
}

export const TripSummary: React.FC<TripSummaryProps> = ({
	remainingTime = "15 min",
	remainingDistance = "5.2 km",
	eta = "10:45 AM",
	onEndTrip
}) => {
	return (
		<View className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl p-6 shadow-2xl pb-10">
			{/* Stats Row */}
			<View className="flex-row justify-between items-center mb-6">
				{/* ETA Column */}
				<View className="flex-1 items-center border-r border-slate-100">
					<Text className="text-slate-400 text-xs uppercase font-semibold mb-1">Arrival</Text>
					<Text className="text-2xl font-bold text-slate-900">{eta}</Text>
				</View>

				{/* Time Column */}
				<View className="flex-1 items-center border-r border-slate-100">
					<Text className="text-slate-400 text-xs uppercase font-semibold mb-1">Time</Text>
					<Text className="text-xl font-bold text-emerald-600">{remainingTime}</Text>
				</View>

				{/* Distance Column */}
				<View className="flex-1 items-center">
					<Text className="text-slate-400 text-xs uppercase font-semibold mb-1">Distance</Text>
					<Text className="text-lg font-bold text-slate-500">{remainingDistance}</Text>
				</View>
			</View>

			{/* Action Button */}
			<TouchableOpacity
				onPress={onEndTrip}
				className="w-full bg-red-600 py-4 rounded-xl shadow-sm active:bg-red-700"
			>
				<Text className="text-white font-bold text-lg text-center">End Trip</Text>
			</TouchableOpacity>
		</View>
	);
};

export const RecenterButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
	<TouchableOpacity
		onPress={onPress}
		className="absolute right-4 bottom-[280px] w-14 h-14 bg-white rounded-full shadow-lg items-center justify-center z-30"
		activeOpacity={0.8}
	>
		<Navigation size={24} color="#007AFF" fill="#007AFF" />
	</TouchableOpacity>
);
