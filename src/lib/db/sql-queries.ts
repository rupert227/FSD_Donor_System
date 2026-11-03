// Simulating sql queries for mock data using in memory since we don't have an actual backend schema for it yet.
// TODO: Migrate this when actual backend is implemented.

import Database from "better-sqlite3";
import { type LeadDetail, SAMPLE_LEADS } from "../mock-data/leads";

let db: Database.Database | null = null;

export function initLocalSQL() {
  ensureDatabase();
}

function ensureDatabase() {
  if (!db) {
    db = new Database(":memory:");

    Leads.init(db);
    console.log(
      `Loaded mock leads to database memory (${SAMPLE_LEADS.length} entries)`,
    );
  }

  return db;
}

export namespace Leads {
  export function init(db: Database.Database) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS lead_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prospect_name TEXT NOT NULL,
      primary_contact_person TEXT NOT NULL,
      email_address TEXT,
      phone_number TEXT NOT NULL,
      target_followup_date TEXT,
      pipeline_status TEXT NOT NULL,
      donor_type TEXT NOT NULL,
      lead_source TEXT NOT NULL,
      title_designation TEXT NOT NULL,
      street_address TEXT NOT NULL,
      city_province TEXT NOT NULL,
      target_campaign TEXT NOT NULL,
      target_amount REAL NOT NULL,
      probability TEXT NOT NULL,
      assigned_officer TEXT NOT NULL,
      action_plan TEXT NOT NULL
    );
  `);

    const insert = db.prepare(`
    INSERT INTO lead_details (
      prospect_name, primary_contact_person, email_address, phone_number,
      target_followup_date, pipeline_status, donor_type, lead_source,
      title_designation, street_address, city_province, target_campaign,
      target_amount, probability, assigned_officer, action_plan
    ) VALUES (
      @prospect_name, @primary_contact_person, @email_address, @phone_number,
      @target_followup_date, @pipeline_status, @donor_type, @lead_source,
      @title_designation, @street_address, @city_province, @target_campaign,
      @target_amount, @probability, @assigned_officer, @action_plan
    )
  `);

    const seed = db.transaction((rows: Omit<LeadDetail, "id">[]) => {
      for (const r of rows) insert.run(r);
    });

    seed(SAMPLE_LEADS);
  }

  export function getReport() {
    const activeDB = ensureDatabase();

    const row = activeDB
      .prepare(
        `SELECT COALESCE(SUM(target_amount), 0) AS total FROM lead_details`,
      )
      .get();

    return row;
  }
}
