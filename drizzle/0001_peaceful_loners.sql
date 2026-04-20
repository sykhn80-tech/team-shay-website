CREATE TABLE `agentAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `agentAccounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`address` varchar(255) NOT NULL,
	`neighborhood` varchar(120) NOT NULL,
	`city` varchar(120) NOT NULL DEFAULT 'ירושלים',
	`price` int NOT NULL,
	`rooms` int NOT NULL,
	`sqm` int NOT NULL,
	`status` enum('חדש','בלעדי','למכירה','נמכר') NOT NULL DEFAULT 'חדש',
	`description` text NOT NULL,
	`featuredImageUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`imageUrl` varchar(512) NOT NULL,
	`imageKey` varchar(512),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `propertyImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `properties` ADD CONSTRAINT `properties_agentId_agentAccounts_id_fk` FOREIGN KEY (`agentId`) REFERENCES `agentAccounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `propertyImages` ADD CONSTRAINT `propertyImages_propertyId_properties_id_fk` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;