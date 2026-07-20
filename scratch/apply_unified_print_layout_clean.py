import os

file_path = r"c:\Users\Admin\Desktop\AgriBiz\src\pages\Sales.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Invoice print container class to always have "dense-layout"
old_class_inv = "print-invoice-layout invoice-print-container ${selectedInvoice.items.length > 3 ? \"dense-layout\" : \"\"}"
new_class_inv = "print-invoice-layout invoice-print-container dense-layout"
content = content.replace(old_class_inv, new_class_inv)

# 2. Update Quotation print container class to always have "dense-layout"
old_class_quot = "print-invoice-layout invoice-print-container ${selectedQuotation.items.length > 3 ? \"dense-layout\" : \"\"}"
new_class_quot = "print-invoice-layout invoice-print-container dense-layout"
content = content.replace(old_class_quot, new_class_quot)


# 3. New Invoice bank details block (18 spaces indentation)
old_bank_block_inv = """                  <div style={{ marginBottom: "8px" }}>
                    <h5 className="invoice-terms-title" style={{ marginBottom: "4px" }}>BANK DETAILS:</h5>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px" }}>
                      <div style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                        <span style={{ fontWeight: 700, color: "#2F3E33" }}>Bank:</span> {settings.bankName}
                      </div>
                      <div style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                        <span style={{ fontWeight: 700, color: "#2F3E33" }}>A/c Name:</span> {settings.accountHolderName}
                      </div>
                      <div style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                        <span style={{ fontWeight: 700, color: "#2F3E33" }}>A/c No:</span> {settings.accountNumber}
                      </div>
                      <div style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                        <span style={{ fontWeight: 700, color: "#2F3E33" }}>IFSC:</span> {settings.ifscCode}
                      </div>
                      {settings.branchName && (
                        <div style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                          <span style={{ fontWeight: 700, color: "#2F3E33" }}>Branch:</span> {settings.branchName}
                        </div>
                      )}
                      {settings.upiId && (
                        <div style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                          <span style={{ fontWeight: 700, color: "#2F3E33" }}>UPI ID:</span> {settings.upiId}
                        </div>
                      )}
                    </div>
                  </div>"""

new_bank_block_inv = """                  <div style={{ marginBottom: "8px" }}>
                    <h5 className="invoice-terms-title" style={{ marginBottom: "4px" }}>BANK DETAILS:</h5>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                      <tbody>
                        <tr>
                          <td style={{ width: "70px", padding: "1.5px 0", fontWeight: 700, color: "#2F3E33", verticalAlign: "top" }}>Bank:</td>
                          <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{settings.bankName}</td>
                        </tr>
                        <tr>
                          <td style={{ width: "70px", padding: "1.5px 0", fontWeight: 700, color: "#2F3E33", verticalAlign: "top" }}>A/c Name:</td>
                          <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{settings.accountHolderName}</td>
                        </tr>
                        <tr>
                          <td style={{ width: "70px", padding: "1.5px 0", fontWeight: 700, color: "#2F3E33", verticalAlign: "top" }}>A/c No:</td>
                          <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{settings.accountNumber}</td>
                        </tr>
                        <tr>
                          <td style={{ width: "70px", padding: "1.5px 0", fontWeight: 700, color: "#2F3E33", verticalAlign: "top" }}>IFSC:</td>
                          <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{settings.ifscCode}</td>
                        </tr>
                        {settings.branchName && (
                          <tr>
                            <td style={{ width: "70px", padding: "1.5px 0", fontWeight: 700, color: "#2F3E33", verticalAlign: "top" }}>Branch:</td>
                            <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{settings.branchName}</td>
                          </tr>
                        )}
                        {settings.upiId && (
                          <tr>
                            <td style={{ width: "70px", padding: "1.5px 0", fontWeight: 700, color: "#2F3E33", verticalAlign: "top" }}>UPI ID:</td>
                            <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{settings.upiId}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>"""

if old_bank_block_inv in content:
    content = content.replace(old_bank_block_inv, new_bank_block_inv)
    print("SUCCESS: Replaced Invoice bank details layout.")
else:
    print("WARNING: Invoice bank details block not found!")


# 4. New Quotation bank details block (20 spaces indentation)
old_bank_block_quot = """                    <div style={{ marginBottom: "8px" }}>
                      <h5 className="invoice-terms-title" style={{ marginBottom: "4px" }}>BANK DETAILS:</h5>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px" }}>
                        <div style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                          <span style={{ fontWeight: 700, color: "#2F3E33" }}>Bank:</span> {settings.bankName}
                        </div>
                        <div style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                          <span style={{ fontWeight: 700, color: "#2F3E33" }}>A/c Name:</span> {settings.accountHolderName}
                        </div>
                        <div style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                          <span style={{ fontWeight: 700, color: "#2F3E33" }}>A/c No:</span> {settings.accountNumber}
                        </div>
                        <div style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                          <span style={{ fontWeight: 700, color: "#2F3E33" }}>IFSC:</span> {settings.ifscCode}
                        </div>
                        {settings.branchName && (
                          <div style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                            <span style={{ fontWeight: 700, color: "#2F3E33" }}>Branch:</span> {settings.branchName}
                          </div>
                        )}
                        {settings.upiId && (
                          <div style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                            <span style={{ fontWeight: 700, color: "#2F3E33" }}>UPI ID:</span> {settings.upiId}
                          </div>
                        )}
                      </div>
                    </div>"""

new_bank_block_quot = """                    <div style={{ marginBottom: "8px" }}>
                      <h5 className="invoice-terms-title" style={{ marginBottom: "4px" }}>BANK DETAILS:</h5>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                        <tbody>
                          <tr>
                            <td style={{ width: "70px", padding: "1.5px 0", fontWeight: 700, color: "#2F3E33", verticalAlign: "top" }}>Bank:</td>
                            <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{settings.bankName}</td>
                          </tr>
                          <tr>
                            <td style={{ width: "70px", padding: "1.5px 0", fontWeight: 700, color: "#2F3E33", verticalAlign: "top" }}>A/c Name:</td>
                            <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{settings.accountHolderName}</td>
                          </tr>
                          <tr>
                            <td style={{ width: "70px", padding: "1.5px 0", fontWeight: 700, color: "#2F3E33", verticalAlign: "top" }}>A/c No:</td>
                            <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{settings.accountNumber}</td>
                          </tr>
                          <tr>
                            <td style={{ width: "70px", padding: "1.5px 0", fontWeight: 700, color: "#2F3E33", verticalAlign: "top" }}>IFSC:</td>
                            <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{settings.ifscCode}</td>
                          </tr>
                          {settings.branchName && (
                            <tr>
                              <td style={{ width: "70px", padding: "1.5px 0", fontWeight: 700, color: "#2F3E33", verticalAlign: "top" }}>Branch:</td>
                              <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{settings.branchName}</td>
                            </tr>
                          )}
                          {settings.upiId && (
                            <tr>
                              <td style={{ width: "70px", padding: "1.5px 0", fontWeight: 700, color: "#2F3E33", verticalAlign: "top" }}>UPI ID:</td>
                              <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{settings.upiId}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>"""

if old_bank_block_quot in content:
    content = content.replace(old_bank_block_quot, new_bank_block_quot)
    print("SUCCESS: Replaced Quotation bank details block.")
else:
    print("WARNING: Quotation bank details block not found!")


# 5. Replace Invoice bottom illustration and signatures container
start_svg_inv = content.find('{/* SVG Illustration centered */}')
end_sig_inv = content.find('{settings.footerMessage && (', start_svg_inv)

new_svg_sig_block_inv = """            {/* Flexible Spacer to absorb extra height when item count is small */}
            <div style={{ flex: 1, minHeight: "8px" }}></div>

            {/* SVG Illustration centered */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: "4px", width: "100%", flexShrink: 0 }}>
              {/* Custom Inline SVG Illustration */}
              <svg viewBox="0 0 500 80" width="100%" height="45" style={{ display: "block", maxWidth: "360px" }}>
                {/* Ground line */}
                <line x1="0" y1="75" x2="500" y2="75" stroke="#EAE3D2" strokeWidth="2.5" />
                
                {/* 1. Tractor with Plow */}
                <rect x="20" y="35" width="45" height="25" fill="#4E6C50" rx="3" />
                <rect x="30" y="20" width="28" height="16" fill="none" stroke="#4E6C50" strokeWidth="2" rx="1" />
                <rect x="32" y="22" width="24" height="12" fill="#FCFAF6" rx="0.5" />
                <rect x="65" y="40" width="18" height="20" fill="#4E6C50" />
                <line x1="83" y1="42" x2="83" y2="55" stroke="#EAE3D2" strokeWidth="1.5" />
                <line x1="72" y1="40" x2="72" y2="18" stroke="#2F3E33" strokeWidth="1.5" />
                {/* Tractor Wheels */}
                <circle cx="32" cy="60" r="13" fill="#2F3E33" />
                <circle cx="32" cy="60" r="5" fill="#EAE3D2" />
                <circle cx="72" cy="63" r="9" fill="#2F3E33" />
                <circle cx="72" cy="63" r="3.5" fill="#EAE3D2" />
                {/* Plow attachment */}
                <path d="M 20 48 L 5 48 L 0 65 M 5 65 L 10 48" stroke="#2F3E33" strokeWidth="1.5" fill="none" />
                <line x1="0" y1="65" x2="-6" y2="70" stroke="#2F3E33" strokeWidth="1.5" />
                <line x1="5" y1="65" x2="-1" y2="70" stroke="#2F3E33" strokeWidth="1.5" />

                {/* 2. Engineering Gear Wheels */}
                <circle cx="160" cy="45" r="16" stroke="#4E6C50" strokeWidth="2" fill="none" />
                <circle cx="160" cy="45" r="6" fill="#4E6C50" />
                <path d="M 160 25 L 160 29 M 160 61 L 160 65 M 140 45 L 144 45 M 176 45 L 180 45 M 146 31 L 149 34 M 171 56 T 174 59 M 146 59 L 149 56 M 171 31 L 174 34" stroke="#4E6C50" strokeWidth="3" />
                
                <circle cx="190" cy="55" r="11" stroke="#2F3E33" strokeWidth="2" fill="none" />
                <circle cx="190" cy="55" r="4" fill="#2F3E33" />
                <path d="M 190 41 L 190 44 M 190 66 L 190 69 M 176 55 L 179 55 M 201 55 L 204 55" stroke="#2F3E33" strokeWidth="2.5" />

                {/* 3. Centrifugal Water Pump & Motor */}
                <rect x="265" y="35" width="40" height="25" fill="#4E6C50" rx="2" />
                {/* Motor fins */}
                <line x1="270" y1="35" x2="270" y2="60" stroke="#FCFAF6" strokeWidth="1" />
                <line x1="275" y1="35" x2="275" y2="60" stroke="#FCFAF6" strokeWidth="1" />
                <line x1="280" y1="35" x2="280" y2="60" stroke="#FCFAF6" strokeWidth="1" />
                <line x1="285" y1="35" x2="285" y2="60" stroke="#FCFAF6" strokeWidth="1" />
                <line x1="290" y1="35" x2="290" y2="60" stroke="#FCFAF6" strokeWidth="1" />
                <line x1="295" y1="35" x2="295" y2="60" stroke="#FCFAF6" strokeWidth="1" />
                <circle cx="318" cy="47" r="14" fill="#2F3E33" />
                {/* Suction & Delivery Pipes */}
                <rect x="313" y="61" width="10" height="14" fill="#2F3E33" />
                <rect x="308" y="72" width="20" height="3" fill="#4E6C50" rx="0.5" />
                <path d="M 322 35 Q 328 20 338 20 L 348 20" stroke="#2F3E33" strokeWidth="4" strokeLinecap="round" fill="none" />
                {/* Water Nozzle Spray */}
                <path d="M 350 18 Q 360 15 370 21 M 350 20 Q 360 23 370 19" stroke="#EAE3D2" strokeWidth="1" fill="none" opacity="0.6" />

                {/* 4. Power Knapsack Sprayer Tank */}
                <rect x="410" y="25" width="26" height="38" fill="#4E6C50" rx="6" />
                <rect x="418" y="21" width="10" height="4" fill="#2F3E33" rx="1" />
                <circle cx="423" cy="35" r="4.5" fill="#FCFAF6" stroke="#2F3E33" strokeWidth="1" />
                <path d="M 436 55 Q 445 65 448 50 T 452 35" stroke="#2F3E33" strokeWidth="1.5" fill="none" />
                <line x1="452" y1="35" x2="472" y2="15" stroke="#2F3E33" strokeWidth="1" />
                {/* Spray mist */}
                <circle cx="474" cy="13" r="1" fill="#EAE3D2" opacity="0.5" />
                <circle cx="477" cy="11" r="1.5" fill="#EAE3D2" opacity="0.4" />
                <circle cx="475" cy="17" r="1.2" fill="#EAE3D2" opacity="0.4" />
              </svg>
            </div>

            {/* Signatures Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "8px", width: "100%", flexShrink: 0 }}>
              <div style={{ textAlign: "center", minWidth: "120px" }}>
                <div style={{ height: "16px" }}></div>
                <p style={{ borderTop: "1.5px solid #EAE3D2", paddingTop: "6px", fontSize: "11px", fontWeight: 700, color: "#4E6C50", whiteSpace: "nowrap", margin: 0 }}>
                  Receiver's Signature
                </p>
              </div>
              <div style={{ textAlign: "center", minWidth: "120px" }}>
                <div style={{ height: "16px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  {settings.signature ? (
                    <img src={settings.signature} alt="E-Signature" style={{ maxHeight: "20px", maxWidth: "100px", objectFit: "contain", mixBlendMode: "multiply" }} />
                  ) : null}
                </div>
                <p style={{ borderTop: "1.5px solid #EAE3D2", paddingTop: "6px", fontSize: "11px", fontWeight: 700, color: "#4E6C50", whiteSpace: "nowrap", margin: 0 }}>
                  Authorized Signatory
                </p>
              </div>
            </div>"""

if start_svg_inv != -1 and end_sig_inv != -1:
    content = content[:start_svg_inv] + new_svg_sig_block_inv + "\n            " + content[end_sig_inv:]
    print("SUCCESS: Replaced Invoice SVG & signatures layout.")
else:
    print("ERROR: Invoice SVG / Signatures block not found!")


# 6. Replace Quotation bottom illustration and signatures container
start_svg_quot = content.find('{/* SVG Illustration centered */}', end_sig_inv) # Search after invoice end index
end_sig_quot = content.find('{settings.footerMessage && (', start_svg_quot)

new_svg_sig_block_quot = """            {/* Flexible Spacer to absorb extra height when item count is small */}
            <div style={{ flex: 1, minHeight: "8px" }}></div>

            {/* SVG Illustration centered */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: "4px", width: "100%", flexShrink: 0 }}>
              {/* Custom Inline SVG Illustration */}
              <svg viewBox="0 0 500 80" width="100%" height="45" style={{ display: "block", maxWidth: "360px" }}>
                {/* Ground line */}
                <line x1="0" y1="75" x2="500" y2="75" stroke="#EAE3D2" strokeWidth="2.5" />
                
                {/* 1. Tractor with Plow */}
                <rect x="20" y="35" width="45" height="25" fill="#4E6C50" rx="3" />
                <rect x="30" y="20" width="28" height="16" fill="none" stroke="#4E6C50" strokeWidth="2" rx="1" />
                <rect x="32" y="22" width="24" height="12" fill="#FCFAF6" rx="0.5" />
                <rect x="65" y="40" width="18" height="20" fill="#4E6C50" />
                <line x1="83" y1="42" x2="83" y2="55" stroke="#EAE3D2" strokeWidth="1.5" />
                <line x1="72" y1="40" x2="72" y2="18" stroke="#2F3E33" strokeWidth="1.5" />
                {/* Tractor Wheels */}
                <circle cx="32" cy="60" r="13" fill="#2F3E33" />
                <circle cx="32" cy="60" r="5" fill="#EAE3D2" />
                <circle cx="72" cy="63" r="9" fill="#2F3E33" />
                <circle cx="72" cy="63" r="3.5" fill="#EAE3D2" />
                {/* Plow attachment */}
                <path d="M 20 48 L 5 48 L 0 65 M 5 65 L 10 48" stroke="#2F3E33" strokeWidth="1.5" fill="none" />
                <line x1="0" y1="65" x2="-6" y2="70" stroke="#2F3E33" strokeWidth="1.5" />
                <line x1="5" y1="65" x2="-1" y2="70" stroke="#2F3E33" strokeWidth="1.5" />

                {/* 2. Engineering Gear Wheels */}
                <circle cx="160" cy="45" r="16" stroke="#4E6C50" strokeWidth="2" fill="none" />
                <circle cx="160" cy="45" r="6" fill="#4E6C50" />
                <path d="M 160 25 L 160 29 M 160 61 L 160 65 M 140 45 L 144 45 M 176 45 L 180 45 M 146 31 L 149 34 M 171 56 T 174 59 M 146 59 L 149 56 M 171 31 L 174 34" stroke="#4E6C50" strokeWidth="3" />
                
                <circle cx="190" cy="55" r="11" stroke="#2F3E33" strokeWidth="2" fill="none" />
                <circle cx="190" cy="55" r="4" fill="#2F3E33" />
                <path d="M 190 41 L 190 44 M 190 66 L 190 69 M 176 55 L 179 55 M 201 55 L 204 55" stroke="#2F3E33" strokeWidth="2.5" />

                {/* 3. Centrifugal Water Pump & Motor */}
                <rect x="265" y="35" width="40" height="25" fill="#4E6C50" rx="2" />
                {/* Motor fins */}
                <line x1="270" y1="35" x2="270" y2="60" stroke="#FCFAF6" strokeWidth="1" />
                <line x1="275" y1="35" x2="275" y2="60" stroke="#FCFAF6" strokeWidth="1" />
                <line x1="280" y1="35" x2="280" y2="60" stroke="#FCFAF6" strokeWidth="1" />
                <line x1="285" y1="35" x2="285" y2="60" stroke="#FCFAF6" strokeWidth="1" />
                <line x1="290" y1="35" x2="290" y2="60" stroke="#FCFAF6" strokeWidth="1" />
                <line x1="295" y1="35" x2="295" y2="60" stroke="#FCFAF6" strokeWidth="1" />
                <circle cx="318" cy="47" r="14" fill="#2F3E33" />
                {/* Suction & Delivery Pipes */}
                <rect x="313" y="61" width="10" height="14" fill="#2F3E33" />
                <rect x="308" y="72" width="20" height="3" fill="#4E6C50" rx="0.5" />
                <path d="M 322 35 Q 328 20 338 20 L 348 20" stroke="#2F3E33" strokeWidth="4" strokeLinecap="round" fill="none" />
                {/* Water Nozzle Spray */}
                <path d="M 350 18 Q 360 15 370 21 M 350 20 Q 360 23 370 19" stroke="#EAE3D2" strokeWidth="1" fill="none" opacity="0.6" />

                {/* 4. Power Knapsack Sprayer Tank */}
                <rect x="410" y="25" width="26" height="38" fill="#4E6C50" rx="6" />
                <rect x="418" y="21" width="10" height="4" fill="#2F3E33" rx="1" />
                <circle cx="423" cy="35" r="4.5" fill="#FCFAF6" stroke="#2F3E33" strokeWidth="1" />
                <path d="M 436 55 Q 445 65 448 50 T 452 35" stroke="#2F3E33" strokeWidth="1.5" fill="none" />
                <line x1="452" y1="35" x2="472" y2="15" stroke="#2F3E33" strokeWidth="1" />
                {/* Spray mist */}
                <circle cx="474" cy="13" r="1" fill="#EAE3D2" opacity="0.5" />
                <circle cx="477" cy="11" r="1.5" fill="#EAE3D2" opacity="0.4" />
                <circle cx="475" cy="17" r="1.2" fill="#EAE3D2" opacity="0.4" />
              </svg>
            </div>

            {/* Signatures Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "8px", width: "100%", flexShrink: 0 }}>
              <div style={{ textAlign: "center", minWidth: "120px" }}>
                <div style={{ height: "16px" }}></div>
                <p style={{ borderTop: "1.5px solid #EAE3D2", paddingTop: "6px", fontSize: "11px", fontWeight: 700, color: "#4E6C50", whiteSpace: "nowrap", margin: 0 }}>
                  Receiver's Signature
                </p>
              </div>
              <div style={{ textAlign: "center", minWidth: "120px" }}>
                <div style={{ height: "16px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  {settings.signature ? (
                    <img src={settings.signature} alt="E-Signature" style={{ maxHeight: "20px", maxWidth: "100px", objectFit: "contain", mixBlendMode: "multiply" }} />
                  ) : null}
                </div>
                <p style={{ borderTop: "1.5px solid #EAE3D2", paddingTop: "6px", fontSize: "11px", fontWeight: 700, color: "#4E6C50", whiteSpace: "nowrap", margin: 0 }}>
                  Authorized Signatory
                </p>
              </div>
            </div>"""

if start_svg_quot != -1 and end_sig_quot != -1:
    content = content[:start_svg_quot] + new_svg_sig_block_quot + "\n            " + content[end_sig_quot:]
    print("SUCCESS: Replaced Quotation SVG & signatures layout.")
else:
    print("ERROR: Quotation SVG / Signatures block not found!")


# 7. Replace conditional styles for footerMessage in both pages
old_footer_inv = """              <div style={{
                textAlign: "center",
                fontSize: selectedInvoice.items.length > 3 ? "9px" : "10px",
                color: "var(--text-muted)",
                borderTop: "1px dashed var(--border-color)",
                paddingTop: selectedInvoice.items.length > 3 ? "4px" : "8px",
                marginTop: "8px",
                width: "100%",
                flexShrink: 0
              }}>"""

new_footer_inv = """              <div style={{
                textAlign: "center",
                fontSize: "9px",
                color: "var(--text-muted)",
                borderTop: "1px dashed var(--border-color)",
                paddingTop: "6px",
                marginTop: "8px",
                width: "100%",
                flexShrink: 0
              }}>"""

content = content.replace(old_footer_inv, new_footer_inv)

old_footer_quot = """                <div style={{
                  textAlign: "center",
                  fontSize: selectedQuotation.items.length > 3 ? "9px" : "10px",
                  color: "var(--text-muted)",
                  borderTop: "1px dashed var(--border-color)",
                  paddingTop: selectedQuotation.items.length > 3 ? "4px" : "8px",
                  marginTop: "8px",
                  width: "100%",
                  flexShrink: 0
                }}>"""

new_footer_quot = """                <div style={{
                  textAlign: "center",
                  fontSize: "9px",
                  color: "var(--text-muted)",
                  borderTop: "1px dashed var(--border-color)",
                  paddingTop: "6px",
                  marginTop: "8px",
                  width: "100%",
                  flexShrink: 0
                }}>"""

content = content.replace(old_footer_quot, new_footer_quot)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("SUCCESS: Finished Sales.tsx updates.")
