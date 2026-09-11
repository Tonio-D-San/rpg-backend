-- CreateEnum
CREATE TYPE "UserDisabledReason" AS ENUM ('ADMIN', 'INACTIVITY');

-- CreateTable
CREATE TABLE "users" (
    "keycloak_sub" VARCHAR(255) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "disabled_at" TIMESTAMPTZ(6),
    "disabled_reason" "UserDisabledReason",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("keycloak_sub")
);

-- CreateTable
CREATE TABLE "groups" (
    "keycloak_group_id" VARCHAR(255) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "path" VARCHAR(512) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("keycloak_group_id")
);

-- CreateTable
CREATE TABLE "user_groups" (
    "user_sub" VARCHAR(255) NOT NULL,
    "group_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synced_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("user_sub","group_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_enabled_last_login_at_idx" ON "users"("enabled", "last_login_at");

-- CreateIndex
CREATE INDEX "users_enabled_created_at_idx" ON "users"("enabled", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "groups_code_key" ON "groups"("code");

-- CreateIndex
CREATE UNIQUE INDEX "groups_path_key" ON "groups"("path");

-- CreateIndex
CREATE INDEX "user_groups_group_id_idx" ON "user_groups"("group_id");

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_user_sub_fkey" FOREIGN KEY ("user_sub") REFERENCES "users"("keycloak_sub") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("keycloak_group_id") ON DELETE CASCADE ON UPDATE CASCADE;
