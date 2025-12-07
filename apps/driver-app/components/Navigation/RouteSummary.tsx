import { View, Text, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { TripStats } from '@/data/mocks';

interface Props {
	stats: TripStats;
	onExit: () => void;
}

export default function RouteSummary({ stats, onExit }: Props) {
	return (
		<View className="w-full">
			{/* Floating Street Name Pill */}
			<View className="self-center mb-4 bg-gray-900 px-4 py-2 rounded-full shadow-lg">
				<Text className="text-white font-bold text-lg">{stats.currentStreet}</Text>
			</View>

			{/* Bottom Card */}
			<View className="bg-gray-900 rounded-t-3xl p-6 shadow-2xl flex-row justify-between items-center">
				{/* Trip Info */}
				<View>
					<View className="flex-row items-baseline gap-2">
						<Text className="text-green-400 font-bold text-2xl">{stats.remainingTime}</Text>
						<Text className="text-gray-400 font-bold text-lg">({stats.remainingDistance})</Text>
					</View>
					<Text className="text-gray-400 text-base font-medium">Arrival at <Text className="text-white">{stats.eta}</Text></Text>
				</View>

				{/* Controls */}
				<View className="flex-row gap-3">
					<TouchableOpacity className="bg-gray-700 w-12 h-12 rounded-full items-center justify-center">
						<Ionicons name="settings-sharp" size={24} color="white" />
					</TouchableOpacity>
					<TouchableOpacity onPress={onExit} className="bg-red-600 w-12 h-12 rounded-full items-center justify-center">
						<Feather name="x" size={28} color="white" />
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}
