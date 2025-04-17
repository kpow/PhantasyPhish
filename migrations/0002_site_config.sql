-- Create site_config table for storing application settings
CREATE TABLE IF NOT EXISTS "site_config" (
  "id" SERIAL PRIMARY KEY,
  "key" VARCHAR(255) NOT NULL UNIQUE,
  "value" JSONB NOT NULL,
  "updated_at" TIMESTAMP DEFAULT now() NOT NULL
);

-- Add initial site configuration with default values
INSERT INTO "site_config" ("key", "value")
VALUES 
  ('app_config', '{"testModeEnabled": true, "siteOverrides": {"bannerMessage": null, "maintenanceMode": false, "predictionsClosed": false}}')
ON CONFLICT ("key") DO NOTHING;