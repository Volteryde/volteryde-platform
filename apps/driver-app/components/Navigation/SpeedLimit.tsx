import { View, Text } from 'react-native';

interface Props {
	currentSpeed: number;
	speedLimit: number;
}

export default function SpeedLimit({ currentSpeed, speedLimit }: Props) {
	const isSpeeding = currentSpeed > speedLimit;

	return (
		<View className="flex-row items-center gap-2">
			{/* Speed Limit Sign */}
			<View className="bg-white border-2 border-gray-800 rounded-lg w-12 h-16 justify-center items-center shadow-sm">
				<Text className="text-black text-[10px] font-bold">SPEED</Text>
				<Text className="text-black text-[10px] font-bold -mt-1">LIMIT</Text>
				<Text className="text-black text-xl font-bold">{speedLimit}</Text>
			</View>

			{/* Current Speed */}
			<View className={`rounded-lg w-12 h-14 justify-center items-center shadow-lg ${isSpeeding ? 'bg-red-600' : 'bg-gray-900'}`}>
				<Text className="text-white text-xl font-bold">{currentSpeed}</Text>
				<Text className="text-gray-300 text-[10px] font-medium">mph</Text>
			</View>
		</View>
	);
}
