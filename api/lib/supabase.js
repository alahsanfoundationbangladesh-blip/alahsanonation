import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let _client = null;
let _logged = false;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseKey);
}

export function getSupabase() {
  if (!isSupabaseConfigured()) {
    if (!_logged) {
      console.warn("[API] Supabase credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) not found. Operating with fallback storage.");
      _logged = true;
    }
    return null;
  }
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.info("[API] Supabase PostgreSQL connection initialized.");
  }
  return _client;
}

export async function dbGetSetting(key) {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) {
      console.warn(`[Supabase] Read site_settings.${key} failed:`, error.message);
      return null;
    }
    return data?.value ?? null;
  } catch (err) {
    console.warn(`[Supabase] Read error for ${key}:`, err.message);
    return null;
  }
}

export async function dbSetSetting(key, value) {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client
      .from("site_settings")
      .upsert(
        {
          key,
          value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    if (error) {
      console.error(`[Supabase] Upsert site_settings.${key} error:`, error.message);
      throw new Error(`Supabase সংরক্ষণ ব্যর্থ: ${error.message}`);
    }
    return true;
  } catch (err) {
    console.error(`[Supabase] Save error for ${key}:`, err.message);
    throw err;
  }
}

export async function dbGetDonations() {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[Supabase] Get donations failed:", error.message);
      return null;
    }
    return (data || []).map(toDonationRecord);
  } catch (err) {
    console.warn("[Supabase] Get donations error:", err.message);
    return null;
  }
}

export async function dbGetDonationById(id) {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("donations")
      .select("*")
      .eq("id", String(id))
      .maybeSingle();
    if (error) {
      console.warn(`[Supabase] Find donation ${id} failed:`, error.message);
      return null;
    }
    return data ? toDonationRecord(data) : null;
  } catch (err) {
    console.warn(`[Supabase] Find donation ${id} error:`, err.message);
    return null;
  }
}

export async function dbCheckTrxExists(trxId) {
  const client = getSupabase();
  if (!client) return false;
  try {
    const normalized = String(trxId).trim().toUpperCase();
    const { data, error } = await client
      .from("donations")
      .select("id")
      .eq("trx_id", normalized)
      .maybeSingle();
    if (error) {
      console.warn("[Supabase] Check TrxID error:", error.message);
      return false;
    }
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function dbInsertDonation(record) {
  const client = getSupabase();
  if (!client) return false;
  const row = toDonationRow(record);
  const { error } = await client
    .from("donations")
    .insert(row);
  if (error) {
    console.error("[Supabase] Insert donation error:", error.message);
    throw new Error(`অনুদান ডেটাবেসে সংরক্ষণ ব্যর্থ: ${error.message}`);
  }
  return true;
}

export async function dbUpdateDonation(id, updates) {
  const client = getSupabase();
  if (!client) return false;
  const updateRow = {};
  if (updates.status !== undefined) updateRow.status = updates.status;
  if (updates.invoiceNumber !== undefined) updateRow.invoice_number = updates.invoiceNumber;
  if (updates.emailStatus !== undefined) updateRow.email_status = updates.emailStatus;
  if (updates.emailError !== undefined) updateRow.email_error = updates.emailError;
  if (updates.emailId !== undefined) updateRow.email_id = updates.emailId;
  if (updates.emailAttempts !== undefined) updateRow.email_attempts = updates.emailAttempts;
  if (updates.approvedAt !== undefined) updateRow.approved_at = updates.approvedAt;
  if (updates.rejectedAt !== undefined) updateRow.rejected_at = updates.rejectedAt;

  const { error } = await client
    .from("donations")
    .update(updateRow)
    .eq("id", String(id));
  if (error) {
    console.error(`[Supabase] Update donation ${id} error:`, error.message);
    throw new Error(`অনুদান আপডেট ব্যর্থ: ${error.message}`);
  }
  return true;
}

export async function dbGetExpenses() {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[Supabase] Get expenses failed:", error.message);
      return null;
    }
    return (data || []).map(toExpenseRecord);
  } catch (err) {
    console.warn("[Supabase] Get expenses error:", err.message);
    return null;
  }
}

export async function dbInsertExpense(record) {
  const client = getSupabase();
  if (!client) return false;
  const row = toExpenseRow(record);
  const { error } = await client
    .from("expenses")
    .insert(row);
  if (error) {
    console.error("[Supabase] Insert expense error:", error.message);
    throw new Error(`ব্যয় সংরক্ষণ ব্যর্থ: ${error.message}`);
  }
  return true;
}

function toDonationRecord(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    method: row.method,
    trxId: row.trx_id || row.trxId,
    amount: Number(row.amount),
    campaignId: row.campaign_id ? Number(row.campaign_id) : (row.campaignId ? Number(row.campaignId) : null),
    campaignTitle: row.campaign_title || row.campaignTitle || "",
    note: row.note || "",
    status: row.status || "pending",
    invoiceNumber: row.invoice_number || row.invoiceNumber || null,
    emailStatus: row.email_status || row.emailStatus || null,
    emailError: row.email_error || row.emailError || null,
    emailId: row.email_id || row.emailId || null,
    emailAttempts: Array.isArray(row.email_attempts) ? row.email_attempts : (Array.isArray(row.emailAttempts) ? row.emailAttempts : []),
    approvedAt: row.approved_at || row.approvedAt || null,
    rejectedAt: row.rejected_at || row.rejectedAt || null,
    createdAt: row.created_at || row.createdAt,
  };
}

function toDonationRow(d) {
  return {
    id: String(d.id),
    name: d.name,
    email: d.email,
    phone: d.phone,
    method: d.method,
    trx_id: d.trxId,
    amount: d.amount,
    campaign_id: d.campaignId ? Number(d.campaignId) : null,
    campaign_title: d.campaignTitle || null,
    note: d.note || null,
    status: d.status || "pending",
    invoice_number: d.invoiceNumber || null,
    email_status: d.emailStatus || null,
    email_error: d.emailError || null,
    email_id: d.emailId || null,
    email_attempts: d.emailAttempts || [],
    approved_at: d.approvedAt || null,
    rejected_at: d.rejectedAt || null,
    created_at: d.createdAt || new Date().toISOString(),
  };
}

function toExpenseRecord(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category || "",
    amount: Number(row.amount),
    note: row.note || "",
    createdBy: row.created_by || row.createdBy || "",
    createdAt: row.created_at || row.createdAt,
  };
}

function toExpenseRow(e) {
  return {
    id: String(e.id),
    title: e.title,
    category: e.category || null,
    amount: e.amount,
    note: e.note || null,
    created_by: e.createdBy || null,
    created_at: e.createdAt || new Date().toISOString(),
  };
}
