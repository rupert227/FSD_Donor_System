"""
One-off: make the seed data look realistic for a demo on 2026-12-02..04.

- Nothing that already happened is dated after CAP (2026-12-01).
  Q4 2026 history (Oct 1 - Dec 31) is compressed into Oct 1 - Dec 1, keeping order.
- Open follow-ups (active donors, recent prospects) are rescheduled around the demo:
  a few overdue, a few due Dec 2/3/4, the rest over the next weeks (weekdays only).
- Prospects that went stale (created before STALE_CUTOFF, not secured) get no follow-up date.
- Old transactions stuck mid-clearance are completed; only recent ones stay in progress.
  The rules from changes/2026-11-27-dispatch-preparation-stage.sql are applied too.

Run from the repo root:  python supabase/seeds/_refresh_dates.py
"""
import random
import re
import sys
from datetime import date, timedelta
from pathlib import Path

HERE = Path(__file__).parent
CAP = date(2026, 12, 1)
DEMO = date(2026, 12, 2)
COMP_START, COMP_SRC_END = date(2026, 10, 1), date(2026, 12, 31)
STALE_CUTOFF = date(2026, 9, 1)
ACTIVE_DONOR = {"Uncontacted", "Followed-up", "Renewal Started"}
MONTHS = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split()
rng = random.Random(20261202)


# ---------------------------------------------------------------- SQL rows
def split_row(body):
    toks, i, n = [], 0, len(body)
    while i < n:
        while body[i] == " ":
            i += 1
        if body[i] == "'":
            j = i + 1
            while True:
                if body[j] == "'" and j + 1 < n and body[j + 1] == "'":
                    j += 2
                elif body[j] == "'":
                    break
                else:
                    j += 1
            toks.append(body[i : j + 1])
            i = j + 1
        else:
            j = body.find(",", i)
            j = n if j == -1 else j
            toks.append(body[i:j].strip())
            i = j
        if i < n and body[i] == ",":
            i += 1
    return toks


def val(tok):
    if tok == "NULL":
        return None
    if tok.startswith("'"):
        return tok[1:-1].replace("''", "'")
    return tok


def lit(v):
    return "NULL" if v is None else "'" + str(v).replace("'", "''") + "'"


def load(path):
    lines = path.read_text(encoding="utf-8").split("\n")
    tables, table, cols, collecting = {}, None, [], False
    for idx, line in enumerate(lines):
        m = re.match(r"INSERT INTO (\w+) \(", line)
        if m:
            table, cols, collecting = m.group(1), [], True
            tables[table] = {"cols": cols, "rows": []}
            continue
        if collecting:
            if line.startswith(") VALUES"):
                collecting = False
            else:
                cols.append(line.strip().rstrip(","))
            continue
        if table and line.startswith("  (") and (line.endswith("),") or line.endswith(")")):
            end = ")," if line.endswith("),") else ")"
            body = line[3 : -len(end)]
            toks = split_row(body)
            assert "  (" + ", ".join(toks) + end == line, f"round trip failed: {line[:80]}"
            row = {c: val(t) for c, t in zip(cols, toks)}
            tables[table]["rows"].append({"idx": idx, "end": end, "toks": toks, "row": row, "orig": dict(row)})
    return lines, tables


def save(path, lines, tables):
    for t in tables.values():
        for r in t["rows"]:
            toks = [
                tok if r["row"][c] == r["orig"][c] else lit(r["row"][c])
                for c, tok in zip(t["cols"], r["toks"])
            ]
            lines[r["idx"]] = "  (" + ", ".join(toks) + r["end"]
    path.write_text("\n".join(lines), encoding="utf-8")


# ---------------------------------------------------------------- dates
def d(s):
    return date.fromisoformat(s[:10]) if s else None


def squeeze(day, clamp=True):
    """Compress Oct 1 - Dec 31 2026 into Oct 1 - Dec 1; clamp anything later to CAP."""
    if day is None or day < COMP_START:
        return day
    span_src = (COMP_SRC_END - COMP_START).days
    span_dst = (CAP - COMP_START).days
    out = COMP_START + timedelta(days=((day - COMP_START).days * span_dst) // span_src)
    return min(out, CAP) if clamp else out


def sq_date(s):
    return squeeze(d(s)).isoformat() if s else s


def sq_ts(s):
    return squeeze(d(s)).isoformat() + s[10:] if s else s


def with_day(ts, day):
    return day.isoformat() + ts[10:]


def weekday(day, forward=True):
    while day.weekday() >= 5:
        day += timedelta(days=1 if forward else -1)
    return day


def plan_followup(bucket):
    """bucket: 'overdue' | 'today' | 'upcoming'"""
    if bucket == "overdue":
        return weekday(DEMO - timedelta(days=rng.randint(1, 12)), forward=False)
    if bucket == "today":
        return DEMO + timedelta(days=rng.randint(0, 2))  # Wed-Fri, Dec 2-4
    return weekday(DEMO + timedelta(days=min(58, 5 + int(rng.expovariate(1 / 14)))))


def buckets(n, overdue=0.06, today=0.06, quota_today=0, quota_overdue=0):
    """Random buckets, with a guaranteed minimum per due-day / overdue for small groups."""
    out = []
    for _ in range(n):
        r = rng.random()
        out.append("overdue" if r < overdue else "today" if r < overdue + today else "upcoming")
    idx = list(range(n))
    rng.shuffle(idx)
    for i in idx[:quota_overdue]:
        out[i] = "overdue"
    forced_days = []
    for k, i in enumerate(idx[quota_overdue : quota_overdue + quota_today]):
        out[i] = "today"
        forced_days.append((i, DEMO + timedelta(days=k % 3)))
    return out, dict(forced_days)


# ================================================================ prospects
p_path = HERE / "prospects-seed.sql"
p_lines, p_tables = load(p_path)
prospects = p_tables["lead_prospects"]["rows"]

for r in prospects:
    row = r["row"]
    row["created_at"] = sq_ts(row["created_at"])
    row["month"] = MONTHS[d(row["created_at"]).month - 1]

open_recent = [r for r in prospects
               if r["row"]["pipeline_status"] != "Secured Donor" and d(r["row"]["created_at"]) >= STALE_CUTOFF]
q4 = [r for r in open_recent if d(r["row"]["created_at"]) >= COMP_START]
rest = [r for r in open_recent if d(r["row"]["created_at"]) < COMP_START]
for group, qt, qo in ((q4, 9, 4), (rest, 3, 2)):
    bks, forced = buckets(len(group), quota_today=qt, quota_overdue=qo)
    for i, (r, b) in enumerate(zip(group, bks)):
        row, created = r["row"], d(r["row"]["created_at"])
        f = forced.get(i) or plan_followup(b)
        if f <= created + timedelta(days=1):
            f = weekday(max(created + timedelta(days=rng.randint(3, 12)), DEMO))
        row["target_followup_date"] = f.isoformat()

for r in prospects:
    row, created = r["row"], d(r["row"]["created_at"])
    if row["pipeline_status"] != "Secured Donor" and created < STALE_CUTOFF:
        row["target_followup_date"] = None
    # last touched: a little after creation, never after CAP
    touched = min(CAP, created + timedelta(days=rng.randint(0, 14)))
    row["updated_at"] = with_day(row["created_at"], touched)

save(p_path, p_lines, p_tables)

# ================================================================ donors
d_path = HERE / "donors-seed.sql"
d_lines, d_tables = load(d_path)
donors = {r["row"]["id"]: r for r in d_tables["donor_profiles"]["rows"]}
txs = d_tables["transactions"]["rows"]
acts = d_tables["donor_outreach_activities"]["rows"]

for r in donors.values():
    r["row"]["created_at"] = sq_ts(r["row"]["created_at"])
for r in acts:
    row = r["row"]
    row["created_at"] = sq_ts(row["created_at"])
    row["updated_at"] = row["created_at"]
    row["followup_date"] = sq_date(row["followup_date"])

by_donor = {}
for r in acts:
    by_donor.setdefault(r["row"]["donor_id"], []).append(r)
for lst in by_donor.values():
    lst.sort(key=lambda r: (r["row"]["created_at"], int(r["row"]["id"])))

active = [r for r in donors.values() if r["row"]["engagement_status"] in ACTIVE_DONOR
          and (by_donor.get(r["row"]["id"]) or r["row"]["target_followup_date"])]
active.sort(key=lambda r: int(r["row"]["id"]))
q4d = [r for r in active if d(r["row"]["created_at"]) >= COMP_START]
oldd = [r for r in active if d(r["row"]["created_at"]) < COMP_START]
plans = {}
for group, qt, qo in ((q4d, 6, 2), (oldd, 6, 6)):
    bks, forced = buckets(len(group), quota_today=qt, quota_overdue=qo)
    for i, (r, b) in enumerate(zip(group, bks)):
        plans[r["row"]["id"]] = forced.get(i) or plan_followup(b)

for did, r in donors.items():
    row = r["row"]
    created = d(row["created_at"])
    hist = by_donor.get(did, [])
    if did in plans:
        f = plans[did]
        if hist:
            last = hist[-1]["row"]
            lo = created if len(hist) == 1 else d(hist[-2]["row"]["created_at"]) + timedelta(days=1)
            lo = max(lo, created)
            cur = d(last["created_at"])
            if not (f - timedelta(days=30) <= cur < f) or cur > CAP:
                cur = f - timedelta(days=rng.randint(5, 18))
            cur = min(max(weekday(cur, forward=False), lo), CAP)
            if f <= cur:
                f = weekday(cur + timedelta(days=rng.randint(3, 14)))
            last["created_at"] = last["updated_at"] = with_day(last["created_at"], cur)
            last["followup_date"] = f.isoformat()
        else:
            f = max(f, weekday(created + timedelta(days=3)))
        row["target_followup_date"] = f.isoformat()
    elif row["target_followup_date"] and row["engagement_status"] in ACTIVE_DONOR:
        row["target_followup_date"] = sq_date(row["target_followup_date"])
    # last contact = most recent outreach entry
    if hist:
        row["last_contact_date"] = d(hist[-1]["row"]["created_at"]).isoformat()
        row["updated_at"] = hist[-1]["row"]["created_at"]
    else:
        row["last_contact_date"] = sq_date(row["last_contact_date"])
        row["updated_at"] = row["created_at"]

# ---------------------------------------------------------------- transactions
def stage(t):
    cash = t["payment_method"] == "Cash"
    if not t["deposit_clearance_date"] or (not cash and not (t["bank_reference_no"] or "")):
        return "Receipt Verification"
    if t["cod_requested"] == "TRUE" and not (t["tax_certificate_no"] or ""):
        return "Certificate Creation"
    if not (t["official_receipt_no"] or "") or t["official_receipt_no"].startswith("PENDING-") or not t["fulfillment_date"]:
        return "Dispatch Preparation"
    return "Transaction Finalized"


advanced = {}
for r in txs:
    t = r["row"]
    t["transaction_date"] = sq_date(t["transaction_date"])
    # A clearance or dispatch that would land after CAP hasn't happened yet
    for c in ("deposit_clearance_date", "fulfillment_date"):
        day = squeeze(d(t[c]), clamp=False)
        t[c] = day.isoformat() if day and day <= CAP else None
    if not t["deposit_clearance_date"]:
        t["fulfillment_date"] = None
        if t["cod_requested"] == "TRUE":
            t["tax_certificate_no"] = None
    t["created_at"] = with_day(t["created_at"], d(t["transaction_date"]))
    # 2026-11-27 rules: cash has no bank details, no certificate unless requested
    if t["payment_method"] == "Cash":
        t["deposit_bank"] = t["bank_reference_no"] = ""
    if t["cod_requested"] != "TRUE":
        t["tax_certificate_no"] = None

    txd = d(t["transaction_date"])
    age = (CAP - txd).days
    before = stage(t)
    cod = t["cod_requested"] == "TRUE"
    # Where a transaction of this age realistically stands in Treasury
    x = rng.random()
    if age <= 2:
        target = "RV"
    elif age <= 10:
        target = "RV" if x < 0.25 else "CC"
    elif age <= 21:
        target = "CC" if x < 0.3 else "DP" if x < 0.7 else "F"
    elif age <= 42:
        target = "DP" if x < 0.25 else "F"
    else:
        target = "F"
    if target == "CC" and not cod:
        target = "DP"
    if target == "RV":
        t["deposit_clearance_date"] = t["fulfillment_date"] = None
        if cod:
            t["tax_certificate_no"] = None
    else:
        if not t["deposit_clearance_date"]:
            t["deposit_clearance_date"] = min(CAP, weekday(txd + timedelta(days=rng.randint(1, 4)))).isoformat()
        if target == "CC":
            t["tax_certificate_no"] = t["fulfillment_date"] = None
        else:
            if cod and not t["tax_certificate_no"]:
                t["tax_certificate_no"] = f"TC-{txd.year}-{int(t['id']):04d}"
            if target == "DP":
                t["fulfillment_date"] = None
            elif not t["fulfillment_date"]:
                clr = d(t["deposit_clearance_date"])
                t["fulfillment_date"] = min(CAP, weekday(clr + timedelta(days=rng.randint(2, 7)))).isoformat()
    # keep the order: transaction <= clearance <= fulfillment
    if t["deposit_clearance_date"] and d(t["deposit_clearance_date"]) < txd:
        t["deposit_clearance_date"] = txd.isoformat()
    if t["fulfillment_date"] and t["deposit_clearance_date"] and t["fulfillment_date"] < t["deposit_clearance_date"]:
        t["fulfillment_date"] = t["deposit_clearance_date"]

    t["treasury_clearance_status"] = stage(t)
    if t["treasury_clearance_status"] == "Transaction Finalized":
        t["amount_collected"] = t["amount_pledge"]
    if t["treasury_clearance_status"] != before:
        advanced[(before, t["treasury_clearance_status"])] = advanced.get((before, t["treasury_clearance_status"]), 0) + 1
    last = max(x for x in (txd, d(t["deposit_clearance_date"]), d(t["fulfillment_date"])) if x)
    t["updated_at"] = last.isoformat() + " 16:30:00+00"

save(d_path, d_lines, d_tables)

# ---------------------------------------------------------------- checks & summary
def summary():
    out = []
    late = lambda s: s and d(s) > CAP
    for name, rows, cols in (
        ("lead_prospects", prospects, ["created_at", "updated_at"]),
        ("donor_profiles", [r for r in donors.values()], ["created_at", "updated_at", "last_contact_date"]),
        ("transactions", txs, ["transaction_date", "deposit_clearance_date", "fulfillment_date", "created_at", "updated_at"]),
        ("donor_outreach_activities", acts, ["created_at"]),
    ):
        bad = sum(1 for r in rows for c in cols if late(r["row"][c]))
        out.append(f"{name}: {len(rows)} rows, event dates after {CAP}: {bad}")
    pend = lambda rows: [r["row"]["target_followup_date"] for r in rows if r["row"]["target_followup_date"]]
    for label, rows in (("prospects", prospects), ("prospects Q4", [r for r in prospects if d(r['row']['created_at']) >= COMP_START]),
                        ("donors", list(donors.values())), ("donors Q4", [r for r in donors.values() if d(r['row']['created_at']) >= COMP_START])):
        f = [d(x) for x in pend(rows)]
        out.append(f"{label}: follow-ups {len(f)} | overdue on Dec 2: {sum(x < DEMO for x in f)}"
                   f" | due Dec 2/3/4: {sum(x == DEMO for x in f)}/{sum(x == DEMO + timedelta(1) for x in f)}/{sum(x == DEMO + timedelta(2) for x in f)}"
                   f" | latest: {max(f) if f else '-'}")
    out.append(f"stale prospects with follow-up cleared: {sum(1 for r in prospects if r['orig']['target_followup_date'] and not r['row']['target_followup_date'])}")
    out.append(f"transactions advanced: {advanced}")
    st = {}
    for r in txs:
        st[r["row"]["treasury_clearance_status"]] = st.get(r["row"]["treasury_clearance_status"], 0) + 1
    out.append(f"transaction stages now: {st}")
    # integrity
    pc = {r["row"]["id"]: d(r["row"]["created_at"]) for r in prospects}
    out.append("donor before its prospect: " + str(sum(1 for r in donors.values() if r["row"]["converted_from_lead_id"] and r["row"]["converted_from_lead_id"] in pc and d(r["row"]["created_at"]) < pc[r["row"]["converted_from_lead_id"]])))
    out.append("tx before donor created: " + str(sum(1 for r in txs if d(r["row"]["transaction_date"]) < d(donors[r["row"]["donor_id"]]["row"]["created_at"]))))
    out.append("outreach out of order: " + str(sum(1 for lst in by_donor.values() for a, b in zip(lst, lst[1:]) if b["row"]["created_at"] < a["row"]["created_at"])))
    mism = sum(1 for did, lst in by_donor.items() if lst[-1]["row"]["status"] != donors[did]["row"]["engagement_status"]
               or (donors[did]["row"]["engagement_status"] in ACTIVE_DONOR and lst[-1]["row"]["followup_date"] != donors[did]["row"]["target_followup_date"]))
    out.append(f"donor vs latest outreach mismatches: {mism}")
    return "\n".join(out)


print(summary())
