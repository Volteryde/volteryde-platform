export type Recommendation = {
	title: string;
	description: string;
	impact: string;
}

export function generateStrategies(
	topUpData: { amount: string; frequency: number }[],
	walletData: { day: string; balance: number }[]
): Recommendation[] {
	const strategies: Recommendation[] = [];

	// 1. Analyze Weekend vs Weekday Balance
	const weekends = walletData.filter(d => ['SAT', 'SUN'].includes(d.day));
	const weekdays = walletData.filter(d => !['SAT', 'SUN'].includes(d.day));

	const avgWeekend = weekends.reduce((acc, curr) => acc + curr.balance, 0) / weekends.length;
	const avgWeekday = weekdays.reduce((acc, curr) => acc + curr.balance, 0) / weekdays.length;

	if (avgWeekend > avgWeekday) {
		strategies.push({
			title: "Weekend Boost",
			description: "15% bonus on top-ups over $50 during weekends",
			impact: "Est. Impact: +$18K revenue"
		});
	} else {
		strategies.push({
			title: "Weekday Commuter Pass",
			description: "Discounted rates for recurring weekday trips",
			impact: "Est. Impact: +15% weekday retention"
		});
	}

	// 2. Analyze Top-Up Frequency (Loyalty)
	const highFreq = topUpData.find(d => d.amount === "¢20")?.frequency || 0;
	if (highFreq > 3000) {
		strategies.push({
			title: "Loyalty Rewards",
			description: "5% cashback for users with 10+ trips/month",
			impact: "Est. Impact: +22% retention"
		});
	}

	// 3. Analyze Low Usage Times (Off-Peak)
	// Heuristic: If we have variability in daily balance, suggest smoothing
	strategies.push({
		title: "Off-Peak Discount",
		description: "10% off rides between 10AM-4PM weekdays",
		impact: "Est. Impact: +35% off-peak usage"
	});

	return strategies;
}
