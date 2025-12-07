
import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';

import clsx from 'clsx';

// Import Assets
const IconLeft = require('../../assets/icons/left.png');
const IconRight = require('../../assets/icons/Sign Board right.png');
const IconArrive = require('../../assets/icons/Location Pin.png');
const IconForward = require('../../assets/icons/Navigator.png'); // Using Navigator as forward arrow

interface ManeuverBannerProps {
	distance?: string; // e.g. "300m"
	rawDistance?: number; // raw meters for logic
	instruction?: string; // e.g. "Turn right"
	modifier?: string; // e.g. "turn-right", "turn-left", "straight"
}

export const ManeuverBanner: React.FC<ManeuverBannerProps> = ({
	distance = "0m",
	rawDistance = 0,
	instruction = "",
	modifier = "straight"
}) => {
	// Logic: Only show specific turn icons if we are close (<= 300m)
	const isClose = rawDistance <= 300;

	let iconSource: ImageSourcePropType;

	if (isClose) {
		if (modifier?.includes('left')) iconSource = IconLeft;
		else if (modifier?.includes('right')) iconSource = IconRight;
		else if (modifier?.includes('arrive')) iconSource = IconArrive;
		else iconSource = IconForward; // default close (e.g. straight)
	} else {
		// Far away -> Keep showing straight/forward
		iconSource = IconForward;
	}

	return (
		<View className="absolute top-12 left-8 z-20 items-center">
			{/* Circle Container */}
			<View
				className={clsx(
					"w-32 h-32 rounded-full items-center justify-center shadow-2xl border-[6px] border-white",
					"bg-emerald-500"
				)}
			>
				<Image
					source={iconSource}
					style={{ width: 80, height: 80 }}
					resizeMode="contain"
				/>
			</View>

			{/* Distance Label below circle */}
			<View className="bg-slate-900 px-6 py-2 rounded-full mt-[-20px] shadow-lg z-30 border-2 border-slate-700">
				<Text className="text-white font-black text-xl text-center">
					{distance}
				</Text>
			</View>
		</View>
	);
};
