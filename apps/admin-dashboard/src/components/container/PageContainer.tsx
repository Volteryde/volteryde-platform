import React from 'react';

type Props = {
	description?: string;
	children: React.ReactNode;
	title?: string;
};

const PageContainer = ({ title, description, children }: Props) => (
	<div className="w-full">
		{(title || description) && (
			<div className="mb-6">
				{title && <h2 className="text-3xl font-bold tracking-tight">{title}</h2>}
				{description && <p className="text-muted-foreground">{description}</p>}
			</div>
		)}
		{children}
	</div>
);

export default PageContainer;
