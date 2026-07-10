import json
import os

log_file = r"C:\Users\Admin\.gemini\antigravity\brain\d8c78017-0388-4f6b-9b30-58ec8afd0f87\.system_generated\logs\transcript.jsonl"
sales_file = r"c:\Users\Admin\Desktop\AgriBiz\src\pages\Sales.tsx"

steps_to_apply = [114, 118, 120, 130, 136, 140, 148, 160, 170]

# Load clean file content
with open(sales_file, "r", encoding="utf-8") as f:
    sales_content = f.read()

# Read transcript to find tool call arguments for each step
replacements = {}
with open(log_file, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            step_idx = data.get("step_index")
            if step_idx in steps_to_apply:
                tool_calls = data.get("tool_calls", [])
                for call in tool_calls:
                    if "replace_file_content" in call.get("name"):
                        args = call.get("args", {})
                        if "Sales.tsx" in (args.get("TargetFile") or ""):
                            replacements[step_idx] = args
        except Exception as e:
            pass

def clean_escapes(s):
    if not s:
        return ""
    if s.startswith('"'):
        s = s[1:]
    if s.endswith('"'):
        s = s[:-1]
    # Fallback unescaping
    s = s.replace("\\\\", "\\")
    s = s.replace("\\n", "\n")
    s = s.replace("\\r", "\r")
    s = s.replace("\\t", "\t")
    s = s.replace("\\'", "'")
    s = s.replace('\\"', '"')
    return s

# Apply replacements in order
for step in steps_to_apply:
    if step not in replacements:
        print(f"Warning: Step {step} replacement not found.")
        continue
    args = replacements[step]
    target = clean_escapes(args["TargetContent"])
    replacement = clean_escapes(args["ReplacementContent"])
    
    # Normalize current file content
    normalized_content = sales_content.replace("\r\n", "\n")
    target_norm = target.replace("\r\n", "\n")
    replacement_norm = replacement.replace("\r\n", "\n")
    
    if target_norm in normalized_content:
        print(f"Applying Step {step}...")
        normalized_content = normalized_content.replace(target_norm, replacement_norm, 1)
        sales_content = normalized_content
    else:
        print(f"Error: Target content for Step {step} not found in file!")
        target_first = target_norm.splitlines()[0] if target_norm.splitlines() else ""
        print(f"Target starts with: {repr(target_first)}")

# Write recovered file (using CRLF for Windows)
with open(sales_file, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(sales_content)
print("Finished recovery.")
