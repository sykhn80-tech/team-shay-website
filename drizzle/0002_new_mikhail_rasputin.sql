CREATE TABLE `leadSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(180) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`neighborhood` varchar(120) NOT NULL,
	`rooms` int NOT NULL,
	`sqm` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leadSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteName` varchar(160) NOT NULL DEFAULT 'Team Shay',
	`headerLogoUrl` varchar(512),
	`footerLogoUrl` varchar(512),
	`landsmanLogoUrl` varchar(512),
	`heroBackgroundUrl` varchar(512),
	`shayAboutImageUrl` varchar(512),
	`heroHeadline` text,
	`heroTypingText` text,
	`whatsappLink` varchar(512),
	`officePhone` varchar(32),
	`aboutTitle` varchar(180),
	`aboutSubtitle` text,
	`landsmanTitle` varchar(180),
	`landsmanBody` text,
	`footerSlogan` varchar(180) NOT NULL DEFAULT 'מתווכים בצד שלך',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quote` text NOT NULL,
	`sourceName` varchar(180) NOT NULL,
	`sourceLabel` varchar(180) NOT NULL DEFAULT 'WhatsApp',
	`stars` int NOT NULL DEFAULT 5,
	`whatsappImageUrl` varchar(512),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `agentAccounts` ADD `accountRole` enum('agent','admin') DEFAULT 'agent' NOT NULL;--> statement-breakpoint
ALTER TABLE `agentAccounts` ADD `roleTitle` varchar(180) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `agentAccounts` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `agentAccounts` ADD `photoUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `agentAccounts` ADD `sortOrder` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `agentAccounts` ADD `isFeaturedOnHomepage` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `agentAccounts` ADD `managedByAdmin` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `agentAccounts` ADD `lastLoginAt` timestamp;--> statement-breakpoint
ALTER TABLE `properties` ADD `street` varchar(180);--> statement-breakpoint
ALTER TABLE `properties` ADD `builtSqm` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `outdoorSpace` varchar(120);--> statement-breakpoint
ALTER TABLE `properties` ADD `floor` int;--> statement-breakpoint
ALTER TABLE `properties` ADD `descriptionHtml` text;--> statement-breakpoint
ALTER TABLE `properties` ADD `isPublished` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `propertyImages` ADD `altText` varchar(255);