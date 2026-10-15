ALTER TABLE `leadSubmissions`
  ADD `source` varchar(120),
  ADD `leadType` varchar(120),
  ADD `marketingConsent` boolean NOT NULL DEFAULT false;
