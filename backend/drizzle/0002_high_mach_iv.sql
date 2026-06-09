-- Roles become organization-scoped. Existing global rows have no owning org,
-- so we drop them; the org-creation hook re-seeds defaults per-org.
TRUNCATE "team_members" CASCADE;--> statement-breakpoint
TRUNCATE "roles" CASCADE;--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_name_unique";--> statement-breakpoint
DROP INDEX "roles_name_uidx";--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "roles_org_name_uidx" ON "roles" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "roles_organization_id_idx" ON "roles" USING btree ("organization_id");