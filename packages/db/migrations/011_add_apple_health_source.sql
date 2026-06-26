-- Add apple_health source to health_metrics
ALTER TABLE health_metrics DROP CONSTRAINT health_metrics_source_check;
ALTER TABLE health_metrics ADD CONSTRAINT health_metrics_source_check CHECK (source IN ('garmin', 'bevel', 'manual', 'apple_health'));
